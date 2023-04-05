import { useCallback, useEffect, useRef, useState } from 'react';

import Link from 'next/link';

import { throttle } from 'lodash';

import { useTranslation } from 'react-i18next';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { v4 as uuid } from 'uuid';

import html2canvas from 'html2canvas';

import html2pdf from 'html2pdf-jspdf2';

import '@fortawesome/fontawesome-free/css/all.min.css';

import styles from '@/styles/Home.module.scss';

import IndexHeader from './components/IndexHeader';

import HeadMeatSetup from './components/HeadMetaSetup';

import MessageItem from './components/MessageItem';
import AvatarUploader from './components/AvatarUploader';

import HistoryTopicList from './components/HistoryTopicList';

import {
    chatWithGptTurbo,
    chatWithGptTurboByProxy,
    generateImageWithText,
    getCurrentApiKeyBilling,
} from '../open.ai.service';

import { Theme, SystemSettingMenu, ERole, IMessage } from '../interface';

import { ChatService } from '../db';

import {
    dataURItoBlob,
    ThemeLocalKey,
    UserAvatarLocalKey,
    RobotAvatarLocalKey,
    SystemRoleLocalKey,
    APIKeyLocalKey,
    GenerateImagePromptPrefix,
    encryptApiKey,
    decryptApiKey,
} from '../utils';

const chatDB = new ChatService();

export default function Home() {
    const windowState = useRef({
        isMobile: false,
        windowHeight: 0,
        virtualKeyboardVisible: false,
        isUsingComposition: false,
    });

    useEffect(() => {
        const isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                window.navigator.userAgent
            );
        windowState.current.isMobile = isMobile;
        windowState.current.windowHeight = window.innerHeight;
        const handleWindowResize = () => {
            windowState.current.virtualKeyboardVisible =
                window.innerHeight < windowState.current.windowHeight;
        };
        window.addEventListener('resize', handleWindowResize);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
        };
    }, []);

    const [theme, setTheme] = useState<Theme>('light');
    const updateTheme = useCallback((theme: Theme) => {
        setTheme(theme);
    }, []);

    const [maskVisible, setMaskVisible] = useState(false);
    const showMask = useCallback(() => {
        setMaskVisible(true);
    }, []);
    const hideMask = useCallback(() => {
        setMaskVisible(false);
    }, []);

    const [tempSystemRoleValue, setTempSystemRoleValue] = useState('');

    const [activeSystemMenu, setActiveSystemMenu] = useState<
        SystemSettingMenu | ''
    >('');

    const [tempApiKeyValue, setTempApiKeyValue] = useState('');
    const [apiKey, setApiKey] = useState('');

    const chatHistoryEle = useRef<HTMLDivElement | null>(null);

    const convertToPDF = () => {
        if (messageList.length === 0) {
            toast.warn('No question and answer content available', {
                autoClose: 1000,
            });
            return;
        }
        setMaskVisible(true);
        const element = chatHistoryEle.current;
        if (!element) return;

        const pdfPageWidth = element.clientWidth;

        const pdfPageHeight = element.scrollHeight;

        const opt = {
            margin: [0, 0, 0, 0],
            filename: `${new Date().getTime().toFixed(10)}myfile.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                width: pdfPageWidth,
                height: pdfPageHeight,
            },
            jsPDF: {
                unit: 'pt',
                format: 'a4',
                orientation: 'portrait',
            },
        };
        html2pdf().from(element).set(opt).save();
        setMaskVisible(false);
    };

    const convertToImage = () => {
        if (messageList.length === 0) {
            toast.warn('No question and answer content available', {
                autoClose: 1000,
            });
            return;
        }
        setMaskVisible(true);
        const messageEleList =
            document.querySelector('#chatHistory')?.childNodes;

        if (!messageEleList) return;
        if (!messageEleList.length) return;
        const promises: Promise<HTMLCanvasElement>[] = Array.from(
            messageEleList
        ).map((item) => {
            return html2canvas(item as HTMLElement);
        });

        Promise.all(promises).then((canvases) => {
            let canvasWidth = 0,
                canvasHeight = 0;
            canvases.forEach((canvas) => {
                canvasWidth = Math.max(canvasWidth, canvas.width);
                canvasHeight += canvas.height;
            });

            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = canvasWidth;
            finalCanvas.height = canvasHeight;

            const context = finalCanvas.getContext('2d');
            if (!context) return;

            let offsetY = 0;
            canvases.forEach((canvas) => {
                if (canvas.width > 0) {
                    context.drawImage(canvas, 0, offsetY);
                    offsetY += canvas.height - 2;
                }
            });

            const imageData = finalCanvas.toDataURL('image/png');

            const blob = dataURItoBlob(imageData);

            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = `${new Date()
                .getTime()
                .toFixed(10)}dialog_list.png`;

            downloadLink.click();
            setMaskVisible(false);
        });
    };

    const [systemRole, setSystemRole] = useState<IMessage>({
        role: ERole.system,
        content: '',
        id: uuid(),
        createdAt: Date.now(),
    });

    const [messageList, setMessageList] = useState<IMessage[]>([]);

    const removeMessageById = useCallback(async (id: string) => {
        await chatDB.deleteConversationById(id);
        setMessageList((list) => list.filter((item) => item.id !== id));
    }, []);

    const updateCurrentMessageList = useCallback((messages: IMessage[]) => {
        setMessageList(messages);
    }, []);

    const [currentUserMessage, setCurrentUserMessage] = useState('');
    const tempCurrentUserMessageId = useRef(uuid());
    const userPromptRef = useRef<HTMLTextAreaElement | null>(null);

    const [currentAssistantMessage, setCurrentAssistantMessage] = useState('');
    const tempCurrentAssistantMessageId = useRef(uuid());

    const [loading, setLoading] = useState(false);

    const controller = useRef<AbortController | null>(null);

    const scrollSmoothThrottle = throttle(
        () => {
            if (!chatHistoryEle.current) return;
            chatHistoryEle.current.scrollTo({
                top: chatHistoryEle.current.scrollHeight,
                behavior: 'smooth',
            });
        },
        300,
        {
            leading: true,
            trailing: false,
        }
    );

    const [serviceErrorMessage, setServiceErrorMessage] = useState('');

    const apiRequestRateLimit = useRef({
        maxRequestsPerMinute: 10,
        requestsThisMinute: 0,
        lastRequestTime: 0,
    });

    const chatGPTTurboWithLatestUserPrompt = async (isRegenerate = false) => {
        // api request rate limit
        const now = Date.now();
        if (now - apiRequestRateLimit.current.lastRequestTime >= 60000) {
            apiRequestRateLimit.current.requestsThisMinute = 0;
            apiRequestRateLimit.current.lastRequestTime = 0;
        }
        if (
            apiRequestRateLimit.current.requestsThisMinute >=
            apiRequestRateLimit.current.maxRequestsPerMinute
        ) {
            toast.warn(`Api Requests are too frequent, try again later! `);
            return;
        }

        if (!apiKey) {
            toast.error('Please set API KEY', {
                autoClose: 1000,
            });
            setActiveSystemMenu(SystemSettingMenu.apiKeySettings);
            return;
        }

        // 先把用户输入信息展示到对话列表
        const currentUserMessage = userPromptRef.current?.value || '';
        if (!isRegenerate && !currentUserMessage) {
            toast.warn('Please  Enter your question', { autoClose: 1000 });
            return;
        }

        const newMessageList = messageList.concat([]);
        if (!isRegenerate) {
            const newUserMessage = {
                role: ERole.user,
                content: currentUserMessage,
                id: uuid(),
                createdAt: Date.now(),
            };
            newMessageList.push(newUserMessage);
            if (activeTopicId) {
                // 更新
                await chatDB.addConversation({
                    topicId: activeTopicId,
                    ...newUserMessage,
                });
            }
        }

        // 当前问答的对话上下文
        const len = newMessageList.length;
        const latestMessageLimit3 = newMessageList.filter(
            (_, idx) => idx >= len - (contextMessageCount + 1)
        );
        if (!latestMessageLimit3.some((item) => item.role === ERole.system)) {
            // system role setting
            latestMessageLimit3.unshift(
                systemRole.content
                    ? systemRole
                    : {
                          role: ERole.system,
                          content:
                              'You are a versatile expert, please answer each of my questions in a simple and easy-to-understand way as much as possible',
                          id: systemRole.id,
                          createdAt: systemRole.createdAt,
                      }
            );
        }

        setMessageList(newMessageList);
        setCurrentUserMessage('');
        userPromptRef.current!.value = '';
        if (!userPromptRef.current) return;
        userPromptRef.current.style.height = 'auto';
        scrollSmoothThrottle();

        const prompt =
            latestMessageLimit3?.[latestMessageLimit3.length - 1]?.content ||
            '';

        const isGenerateImage =
            prompt?.startsWith(GenerateImagePromptPrefix) || false;

        try {
            setServiceErrorMessage('');
            setLoading(true);
            controller.current = new AbortController();

            let response: Response;
            if (isGenerateImage) {
                response = await generateImageWithText(
                    apiKey,
                    prompt,
                    controller.current
                );
            } else {
                // user api key
                response = await chatWithGptTurbo(
                    apiKey,
                    latestMessageLimit3,
                    controller.current
                );
            }

            apiRequestRateLimit.current.requestsThisMinute += 1;

            if (!response.ok) {
                throw new Error(response.statusText);
            }
            if (isGenerateImage) {
                const generateImgInfo = await response.json();
                archiveCurrentMessage(generateImgInfo?.data?.[0]?.url);
                setTimeout(() => {
                    scrollSmoothThrottle();
                }, 2000);
            } else {
                const data = response.body;
                if (!data) {
                    throw new Error('No Data');
                }
                const reader = data.getReader();
                const decoder = new TextDecoder('utf-8');
                let newCurrentAssistantMessage = '';
                // 循环读取数据
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }
                    // 处理读取到的数据块
                    if (value) {
                        let char = decoder.decode(value);
                        if (
                            char === `\n` &&
                            newCurrentAssistantMessage.endsWith(`\n`)
                        ) {
                            continue;
                        }
                        if (char) {
                            newCurrentAssistantMessage += char;
                            setCurrentAssistantMessage(
                                newCurrentAssistantMessage
                            );
                        }
                        scrollSmoothThrottle();
                    }
                }
                archiveCurrentMessage(newCurrentAssistantMessage);
            }
            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            controller.current = null;
            setServiceErrorMessage(error?.error?.message || 'Service Error');
        }
    };

    const archiveCurrentMessage = (newCurrentAssistantMessage: string) => {
        if (newCurrentAssistantMessage) {
            const newAssistantMessage = {
                role: ERole.assistant,
                content: newCurrentAssistantMessage,
                id: uuid(),
                createdAt: Date.now(),
            };
            setMessageList((list) => list.concat([newAssistantMessage]));
            if (activeTopicId) {
                // 更新
                chatDB.addConversation({
                    topicId: activeTopicId,
                    ...newAssistantMessage,
                });
            }
            setLoading(false);
            controller.current = null;
            setCurrentAssistantMessage('');
            scrollSmoothThrottle();
        }
    };

    // 头像
    const [robotAvatar, setRobotAvatar] = useState<string>('/robot.png');

    const updateRobotAvatar = (img: string) => {
        setRobotAvatar(img);
        setActiveSystemMenu('');

        window.localStorage.setItem(RobotAvatarLocalKey, img);
    };

    const [userAvatar, setUserAvatar] = useState<string>('/fox.png');

    const updateUserAvatar = (img: string) => {
        setUserAvatar(img);
        setActiveSystemMenu('');

        window.localStorage.setItem(UserAvatarLocalKey, img);
    };

    useEffect(() => {
        const light_gpt_theme =
            window.localStorage.getItem(ThemeLocalKey) || 'light';
        setTheme(light_gpt_theme as Theme);
        const light_gpt_user_avatar =
            window.localStorage.getItem(UserAvatarLocalKey) || '/fox.png';
        setUserAvatar(light_gpt_user_avatar);
        const light_gpt_robot_avatar =
            window.localStorage.getItem(RobotAvatarLocalKey) || '/robot.png';
        setRobotAvatar(light_gpt_robot_avatar);
        const light_gpt_system_role =
            window.localStorage.getItem(SystemRoleLocalKey) || '';
        if (light_gpt_system_role !== '') {
            setSystemRole({
                role: ERole.system,
                content: light_gpt_system_role,
                id: uuid(),
                createdAt: Date.now(),
            });
        }
        const light_gpt_api_key =
            window.localStorage.getItem(APIKeyLocalKey) || '';
        const decryptedApiKey = decryptApiKey(light_gpt_api_key);
        if (decryptedApiKey !== '') {
            // 不显示设置过的api_key
            setApiKey(decryptedApiKey);
            setTempApiKeyValue(decryptedApiKey);
        }
    }, []);

    const [activeTopicId, setActiveTopicId] = useState('');
    const changeActiveTopicId = useCallback((id: string) => {
        setActiveTopicId(id);
    }, []);

    const [asideVisible, setAsideVisible] = useState(true);

    const toggleAsideVisible = useCallback(() => {
        setAsideVisible((visible) => !visible);
    }, []);

    const { t, i18n } = useTranslation();

    const SystemMenus = [
        {
            label: t('robotAvatarSetting'),
            iconName: 'fa-robot',
            value: SystemSettingMenu.robotAvatarSettings,
        },
        {
            label: t('userAvatarSettings'),
            iconName: 'fa-user',
            value: SystemSettingMenu.userAvatarSettings,
        },
        {
            label: t('systemRoleSettings'),
            iconName: 'fa-id-badge',
            value: SystemSettingMenu.systemRoleSettings,
        },
        {
            label: t('apiKeySettings'),
            iconName: 'fa-key',
            value: SystemSettingMenu.apiKeySettings,
        },
    ];

    const [isZh, setIsZh] = useState(true);

    const changeLanguage = () => {
        const newIsZh = !isZh;
        i18n.changeLanguage(newIsZh ? 'zh' : 'en');
        setIsZh(newIsZh);
    };

    const [contextMessageCount, setContextMessageCount] = useState(5);

    return (
        <div id="app" className={styles.app} data-theme={theme}>
            <aside
                id="appAside"
                className={`${styles.aside} ${asideVisible && styles.show}`}
            >
                <div
                    className={`${styles.asideToggle} ${
                        asideVisible && styles.asideShow
                    }`}
                    onClick={toggleAsideVisible}
                >
                    {asideVisible ? (
                        <i className="fas fa-chevron-left"></i>
                    ) : (
                        <i className="fas fa-chevron-right"></i>
                    )}
                </div>
                {/** 历史对话 */}
                <div className={styles.historyTopicListContainer}>
                    <HistoryTopicList
                        historyTopicListVisible={asideVisible}
                        currentMessageList={messageList}
                        updateCurrentMessageList={updateCurrentMessageList}
                        activeTopicId={activeTopicId}
                        changeActiveTopicId={changeActiveTopicId}
                        showMask={showMask}
                        hideMask={hideMask}
                    />
                </div>

                <div className={styles.divider}></div>

                {/** 站点设置 */}
                <div className={styles.siteSettings}>
                    <div
                        className={styles.menu}
                        onClick={() => {
                            console.log('主题切换---');
                            setTheme(theme === 'light' ? 'dark' : 'light');
                            const secretKey = process.env.SECRET_KEY;
                            console.log('secret-key--', secretKey);
                            window.localStorage.setItem(
                                ThemeLocalKey,
                                theme === 'light' ? 'dark' : 'light'
                            );
                        }}
                    >
                        {theme === 'light' ? (
                            <i className="fas fa-sun"></i>
                        ) : (
                            <i className="fas fa-moon"></i>
                        )}
                        <div>
                            {theme === 'dark'
                                ? t('changeLightMode')
                                : t('changeDarkMode')}
                        </div>
                    </div>
                    <div className={styles.menu} onClick={changeLanguage}>
                        <i className={`fas fa-language`}></i>
                        <div>{t('changeLanguage')}</div>
                    </div>
                    {SystemMenus.map((menu) => (
                        <div
                            key={menu.value}
                            className={styles.menu}
                            onClick={() => {
                                setActiveSystemMenu(menu.value);
                            }}
                        >
                            <i className={`fas ${menu.iconName}`}></i>
                            <div>{menu.label}</div>
                        </div>
                    ))}
                    <div className={styles.menu}>
                        <span>{t('chatBackgroundContext')}</span>
                        <input
                            value={contextMessageCount}
                            onChange={(e) => {
                                const text = e.target.value;
                                const count = Number.isNaN(Number(text))
                                    ? 3
                                    : Number(text);
                                setContextMessageCount(count);
                            }}
                            type="text"
                        />
                        
                    </div>
                </div>
            </aside>

            <main className={styles.conversationContent}>
                <HeadMeatSetup></HeadMeatSetup>

                <ToastContainer></ToastContainer>

                <div className={styles.header}>
                    <IndexHeader
                        apiKey={apiKey}
                        theme={theme}
                        updateTheme={updateTheme}
                    />
                </div>
                <div className={styles.main}>
                    {apiKey ? (
                        <div
                            id="chatHistory"
                            className={styles.chatHistory}
                            ref={(e) => (chatHistoryEle.current = e)}
                        >
                            {messageList
                                .filter((item) => item.role !== ERole.system)
                                .map((item) => (
                                    <MessageItem
                                        key={item.id}
                                        id={item.id}
                                        role={item.role}
                                        avatar={
                                            item.role === ERole.user
                                                ? userAvatar
                                                : robotAvatar
                                        }
                                        message={item.content}
                                        removeMessageById={removeMessageById}
                                    />
                                ))}
                            { !loading && currentUserMessage.length > 0 && (
                                <MessageItem id={tempCurrentUserMessageId.current}
                                    role={ERole.user}
                                    avatar={userAvatar}
                                    message={currentUserMessage}
                                    isTemp
                                />
                            ) }
                            {loading && currentAssistantMessage.length > 0 && (
                                <MessageItem
                                    id={tempCurrentAssistantMessageId.current}
                                    role={ERole.assistant}
                                    avatar={robotAvatar}
                                    message={currentAssistantMessage}
                                    isTemp
                                />
                            )}
                            <div className={styles.placeholder}>
                                <div className={styles.child}></div>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.apiKeyRequiredTip}>
                            <div className={styles.title}>
                                OpenAI API Key Required
                            </div>
                            <div className={styles.desc}>
                                {t('apiKeyRequiredTip1')}
                            </div>
                            <div className={styles.desc}>
                                {t('apiKeyRequiredTip2')}
                                <Link href="https://openai.com" target="_blank">
                                    Open Ai Platform
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
                <div className={styles.footer}>
                    {serviceErrorMessage !== '' && (
                        <div className={styles.openAiServiceError}>
                            {serviceErrorMessage}
                        </div>
                    )}

                    <div className={styles.action}></div>
                    <div className={styles.middle}>
                        <div className={styles.textareaContainer}>
                            {/** mobile regenerate and stop action */}
                            <div className={styles.mobileAction}>
                                {loading ? (
                                    <div
                                        className={styles.btn}
                                        onClick={() => {
                                            if (controller.current) {
                                                controller.current.abort();
                                                setLoading(false);
                                                archiveCurrentMessage(
                                                    currentAssistantMessage
                                                );
                                            }
                                        }}
                                    >
                                        Stop
                                    </div>
                                ) : (
                                    <div
                                        className={styles.btn}
                                        onClick={() =>
                                            chatGPTTurboWithLatestUserPrompt(
                                                true
                                            )
                                        }
                                    >
                                        Regenerate
                                    </div>
                                )}
                            </div>
                            <textarea
                                className={styles.userPrompt}
                                disabled={loading}
                                onInput={() => {
                                    if (
                                        userPromptRef.current &&
                                        userPromptRef.current.scrollHeight > 50
                                    ) {
                                        userPromptRef.current.style.height =
                                            userPromptRef.current.scrollHeight +
                                            2 +
                                            'px';
                                    }
                                    setCurrentUserMessage(userPromptRef.current!.value)
                                    scrollSmoothThrottle();
                                }}
                                ref={(e) => {
                                    userPromptRef.current = e;
                                }}
                                placeholder={
                                    loading
                                        ? 'ai is thinking...'
                                        : 'ask questions or type "img-prompt" to generate img'
                                }
                                rows={1}
                                onKeyDown={(event) => {
                                    // pc desktop
                                    if (!windowState.current.isMobile) {
                                        if (
                                            event.code === 'Enter' &&
                                            !event.shiftKey &&
                                            (event.metaKey || event.ctrlKey)
                                        ) {
                                            if (
                                                windowState.current
                                                    .isUsingComposition
                                            )
                                                return;
                                            chatGPTTurboWithLatestUserPrompt(
                                                false
                                            );
                                            event.preventDefault();
                                        } 
                                    }
                                    // mobile desktop
                                    if (
                                        windowState.current.isMobile &&
                                        (event.key === 'Enter' ||
                                            event.key === 'Done')
                                    ) {
                                        (
                                            document.activeElement as HTMLElement
                                        ).blur();
                                    }
                                }}
                                onBlur={() => {
                                    if (windowState.current.isMobile) {
                                        chatGPTTurboWithLatestUserPrompt(false);
                                    }
                                }}
                                onCompositionStart={() => {
                                    windowState.current.isUsingComposition =
                                        true;
                                }}
                                onCompositionEnd={() => {
                                    windowState.current.isUsingComposition =
                                        false;
                                }}
                            />
                            <div className={styles.submit}>
                                {loading ? (
                                    <div className={styles.spinner}></div>
                                ) : (
                                    <i
                                        className="fas fa-paper-plane"
                                        style={{ transform: 'scale(1.2)' }}
                                        onClick={() =>
                                            chatGPTTurboWithLatestUserPrompt(
                                                false
                                            )
                                        }
                                    ></i>
                                )}
                            </div>
                        </div>
                        <div className={styles.siteDescription}>
                            <span>Made by wjm</span>
                            <span>｜</span>
                            <span>Just have fun</span>
                        </div>
                    </div>
                    <div className={styles.action}>
                        {loading ? (
                            <div
                                className={styles.btn}
                                onClick={() => {
                                    if (controller.current) {
                                        controller.current.abort();
                                        setLoading(false);
                                        archiveCurrentMessage(
                                            currentAssistantMessage
                                        );
                                    }
                                }}
                            >
                                Stop
                            </div>
                        ) : (
                            <div
                                className={styles.btn}
                                onClick={() =>
                                    chatGPTTurboWithLatestUserPrompt(true)
                                }
                            >
                                Regenerate
                            </div>
                        )}
                    </div>
                </div>
                {/** extra function menus */}
                <div
                    className={`${styles.extraFunction} ${
                        !messageList.length && styles.noMessage
                    }`}
                >
                    <i className="fas fa-image" onClick={convertToImage}></i>
                    <i className="fas fa-file-download" onClick={convertToPDF}></i>
                    <i
                        className="fas fa-redo-alt"
                        onClick={() => {
                            if (messageList.length === 0) {
                                toast.warn(
                                    'No question and answer content available',
                                    { autoClose: 1000 }
                                );
                                return;
                            }
                            setMessageList([]);
                        }}
                    ></i>
                </div>
            </main>

            <div
                className={`${styles.modal} ${
                    !activeSystemMenu && styles.hide
                }`}
            >
                <div className={styles.modalContent}>
                    <i
                        className={`fas fa-times ${styles.closeIcon}`}
                        onClick={() => {
                            setActiveSystemMenu('');
                        }}
                    ></i>
                    {activeSystemMenu ===
                        SystemSettingMenu.robotAvatarSettings && (
                        <AvatarUploader
                            title={t('robotAvatarSetting')}
                            img={robotAvatar}
                            updateAvatar={updateRobotAvatar}
                        />
                    )}
                    {activeSystemMenu ===
                        SystemSettingMenu.userAvatarSettings && (
                        <AvatarUploader
                            title={t('userAvatarSettings')}
                            img={userAvatar}
                            updateAvatar={updateUserAvatar}
                        />
                    )}
                    {activeSystemMenu ===
                        SystemSettingMenu.systemRoleSettings && (
                        <div className={styles.systemRoleSettings}>
                            <label htmlFor="systemRole">System Role</label>
                            <textarea
                                placeholder="Enter system role here"
                                id="systemRole"
                                value={tempSystemRoleValue}
                                rows={4}
                                onChange={(e) => {
                                    setTempSystemRoleValue(e.target.value);
                                }}
                            ></textarea>

                            <div className={styles.description}>
                                {t('systemRoleDescription')}
                            </div>

                            <div className={styles.benefits}>
                                {t('systemRoleHelp')}
                                <Link
                                    href="https://github.com/f/awesome-chatgpt-prompts"
                                    target="_blank"
                                >
                                    Awesome ChatGPT Prompts
                                </Link>{' '}
                            </div>
                            <div className={styles.btnContainer}>
                                <button
                                    className={styles.saveButton}
                                    onClick={() => {
                                        setActiveSystemMenu('');

                                        setSystemRole({
                                            role: ERole.system,
                                            content: tempSystemRoleValue,
                                            id: uuid(),
                                            createdAt: systemRole.createdAt,
                                        });
                                        window.localStorage.setItem(
                                            ThemeLocalKey,
                                            tempSystemRoleValue
                                        );
                                        toast.success('Successful update', {
                                            autoClose: 1000,
                                        });
                                    }}
                                >
                                    {t('save')}
                                </button>
                            </div>
                        </div>
                    )}
                    {activeSystemMenu === SystemSettingMenu.apiKeySettings && (
                        <div className={styles.systemRoleSettings}>
                            <label htmlFor="apiKey">Open AI API Key</label>
                            <input
                                placeholder="Enter your open ai api key"
                                id="apiKey"
                                value={tempApiKeyValue}
                                onChange={(e) => {
                                    setTempApiKeyValue(e.target.value);
                                }}
                            ></input>

                            <div className={styles.description}>
                                {t('apiKeyDescription')}
                            </div>

                            <div className={styles.benefits}>
                                {t('apiKeyHelp')}
                                <Link
                                    href="https://platform.openai.com/account/api-keys"
                                    target="_blank"
                                >
                                    Open AI Platform API KEYS
                                </Link>{' '}
                            </div>
                            <div className={styles.btnContainer}>
                                <button
                                    className={styles.saveButton}
                                    onClick={() => {
                                        setActiveSystemMenu('');
                                        setApiKey(tempApiKeyValue);

                                        const encryptedApiKey =
                                            encryptApiKey(tempApiKeyValue);
                                        window.localStorage.setItem(
                                            APIKeyLocalKey,
                                            encryptedApiKey
                                        );
                                        toast.success('Successful update', {
                                            autoClose: 1000,
                                        });
                                    }}
                                >
                                    {t('save')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/** 生成图片、pdf的简单loading */}
            {maskVisible && (
                <div className={styles.loading}>
                    <div className={styles.loadingSpinner}></div>
                </div>
            )}

            {/** mobile aside show mask */}
            {asideVisible && <div className={styles.mobileAsideShowMask}></div>}
        </div>
    );
}

import { useEffect, useRef, useState } from 'react';

import { throttle } from 'lodash';

import { useRouter } from 'next/router';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { v4 as uuid } from 'uuid';

import html2canvas from 'html2canvas';

import html2pdf from 'html2pdf-jspdf2';

import Link from 'next/link';

import '@fortawesome/fontawesome-free/css/all.min.css';

import styles from '@/styles/Home.module.scss';

import HeadMeatSetup from './components/HeadMetaSetup';

import MessageItem from './components/MessageItem';
import AvatarUploader from './components/AvatarUploader';

import { chatWithGptTurbo, chatWithGptTurboByProxy } from '../open.ai.service';

import { Theme, SystemSettingMenu, ERole, IMessage } from '../interface';

import { onAuthStateChanged, signOut } from 'firebase/auth';

import { auth } from '../firebase';

import { ChatService } from '../db';

import {
    dataURItoBlob,
    ThemeLocalKey,
    UserAvatarLocalKey,
    RobotAvatarLocalKey,
    SystemRoleLocalKey,
    APIKeyLocalKey,
} from '../utils';

const chatDB = new ChatService();

const SystemMenus = [
    {
        label: 'Robot Avatar Settings',
        value: SystemSettingMenu.robotAvatarSettings,
    },
    {
        label: 'User Avatar Settings',
        value: SystemSettingMenu.userAvatarSettings,
    },
    {
        label: 'System Role Settings',
        value: SystemSettingMenu.systemRoleSettings,
    },
    {
        label: 'API KEY Settings',
        value: SystemSettingMenu.apiKeySettings,
    },
];

export default function Home() {
    const router = useRouter();
    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in, see docs for a list of available properties
                // https://firebase.google.com/docs/reference/js/firebase.User
                const uid = user.uid;
                console.log('user--', user);
                // ...
            } else {
                // User is signed out
                // ...
                router.push('/login');
            }
        });
    }, [router]);

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

    const [isGenerateFile, setIsGenerateFile] = useState(false);

    const [tempSystemRoleValue, setTempSystemRoleValue] = useState('');

    const [systemMenuVisible, setSystemMenuVisible] = useState(false);
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
        setIsGenerateFile(true);
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
        setIsGenerateFile(false);
    };

    const convertToImage = () => {
        if (messageList.length === 0) {
            toast.warn('No question and answer content available', {
                autoClose: 1000,
            });
            return;
        }
        setIsGenerateFile(true);
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
            setIsGenerateFile(false);
        });
    };

    const [systemRole, setSystemRole] = useState<IMessage>({
        role: ERole.system,
        content: '',
        id: uuid(),
        createdAt: Date.now(),
    });

    const [messageList, setMessageList] = useState<IMessage[]>([]);
    const [currentUserMessage, setCurrentUserMessage] = useState('');
    const userPromptRef = useRef<HTMLTextAreaElement | null>(null);

    const [currentAssistantMessage, setCurrentAssistantMessage] = useState('');

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

    const chatGPTTurboWithLatestUserPrompt = async (isRegenerate = false) => {
        if (!apiKey) {
            toast.error('Please set API KEY', {
                autoClose: 3000,
            });
            setSystemMenuVisible(true);
            setActiveSystemMenu(SystemSettingMenu.apiKeySettings);
            return;
        }

        // 先把用户输入信息展示到对话列表
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
                chatDB.addConversation({
                    topicId: activeTopicId,
                    ...newUserMessage,
                });
            }
        }

        // 取出最近的3条messages，作为上下文
        const len = newMessageList.length;
        const latestMessageLimit3 = newMessageList.filter(
            (_, idx) => idx >= len - 4
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
        if (!userPromptRef.current) return;
        userPromptRef.current.style.height = 'auto';
        scrollSmoothThrottle();

        try {
            setServiceErrorMessage('');
            setLoading(true);
            controller.current = new AbortController();

            // user api key
            const response = await chatWithGptTurbo(
                apiKey,
                latestMessageLimit3,
                controller.current
            );

            if (!response.ok) {
                throw new Error(response.statusText);
            }
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
                        setCurrentAssistantMessage(newCurrentAssistantMessage);
                    }
                    scrollSmoothThrottle();
                }
            }
            setLoading(false);
            archiveCurrentMessage(newCurrentAssistantMessage);
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
            setCurrentUserMessage('');
            setCurrentAssistantMessage('');
        }
    };

    // 头像
    const [robotAvatar, setRobotAvatar] = useState<string>('/robot.png');

    const updateRobotAvatar = (img: string) => {
        setRobotAvatar(img);
        setActiveSystemMenu('');
        setSystemMenuVisible(false);
        window.localStorage.setItem(RobotAvatarLocalKey, img);
    };

    const [userAvatar, setUserAvatar] = useState<string>('/fox.png');

    const updateUserAvatar = (img: string) => {
        setUserAvatar(img);
        setActiveSystemMenu('');
        setSystemMenuVisible(false);
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
        if (light_gpt_api_key !== '') {
            // 不显示设置过的api_key
            setApiKey(light_gpt_api_key);
        }
    }, []);

    const [activeTopicId, setActiveTopicId] = useState('');

    const [historyTopicList, setHistoryTopicList] = useState<
        { id: string; name: string }[]
    >([]);

    useEffect(() => {
        chatDB.getTopics().then((topics) => {
            setHistoryTopicList(topics || []);
        });
    }, []);

    const generateTopic = () => {
        if (messageList.length === 0) return;
        const topicName =
            messageList
                .find((item) => item.role === ERole.user)
                ?.content?.slice(0, 10) ||
            `主题${new Date().getTime().toFixed(10)}`;
        const topicId = uuid();
        const topic = {
            id: topicId,
            name: topicName,
            createdAt: Date.now(),
        };

        chatDB.addTopic(topic);
        let newHistoryTopicList = historyTopicList.concat([]);
        newHistoryTopicList.unshift(topic);
        setHistoryTopicList(newHistoryTopicList);
        messageList.forEach((message) => {
            chatDB.addConversation({
                topicId: topicId,
                id: message.id,
                role: message.role,
                content: message.content,
                createdAt: message.createdAt,
            });
        });
        setMessageList([]);
    };

    const [historyTopicListVisible, setHistoryTopicListVisible] =
        useState(true);

    return (
        <div id="app" className={styles.app} data-theme={theme}>
            <HeadMeatSetup></HeadMeatSetup>

            <ToastContainer></ToastContainer>

            {/** 历史对话记录 */}
            <div
                className={`${styles.historyTopicListContainer} ${
                    !historyTopicListVisible && styles.hide
                }`}
            >
                <div
                    className={styles.mobileHistoryTopicListToggle}
                    onClick={() =>
                        setHistoryTopicListVisible((visible) => !visible)
                    }
                >
                    {historyTopicListVisible ? (
                        <i className="fas fa-chevron-left"></i>
                    ) : (
                        <i className="fas fa-chevron-right"></i>
                    )}
                </div>
                <div
                    className={styles.newChatBtn}
                    onClick={() => {
                        if (activeTopicId) {
                            setActiveTopicId('');
                            setMessageList([]);
                            return;
                        }
                        // 新建主题，将当前对话信息存储在新建的主题下，然后清空messageList
                        generateTopic();
                    }}
                >
                    <i className="fas fa-plus"></i>
                    <span>New Chat</span>
                </div>
                <div className={styles.historyTopicList}>
                    <div className={styles.inner}>
                        {historyTopicList.map((item) => {
                            const isActive = item.id === activeTopicId;
                            return (
                                <div
                                    key={item.id}
                                    className={`${styles.historyTopic} ${
                                        isActive && styles.active
                                    } `}
                                    onClick={async () => {
                                        if (activeTopicId === '') {
                                            generateTopic();
                                        }
                                        setActiveTopicId(item.id);
                                        // 找出历史对话
                                        setIsGenerateFile(true);
                                        const messageList =
                                            await chatDB.getConversationsByTopicId(
                                                item.id
                                            );
                                        setMessageList(
                                            messageList as IMessage[]
                                        );

                                        setIsGenerateFile(false);
                                    }}
                                >
                                    <i className="fas fa-comment"></i>
                                    <div className={styles.topicName}>
                                        {item.name}
                                    </div>
                                    <i
                                        className={`fas fa-times ${styles.remove}`}
                                        onClick={async () => {
                                            await chatDB.deleteTopicById(
                                                item.id
                                            );
                                            setHistoryTopicList((list) =>
                                                list.filter(
                                                    (o) => o.id !== item.id
                                                )
                                            );
                                            setMessageList([]);
                                            setActiveTopicId('');
                                            toast.success(
                                                'Successful deleted topic',
                                                {
                                                    autoClose: 1000,
                                                }
                                            );
                                        }}
                                    ></i>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div
                className={`${styles.systemSettingMenus} ${
                    systemMenuVisible && styles.show
                }`}
            >
                {SystemMenus.map((menu) => (
                    <div
                        key={menu.value}
                        className={styles.menu}
                        onClick={() => {
                            setActiveSystemMenu(menu.value);
                        }}
                    >
                        {menu.label}
                    </div>
                ))}
            </div>
            <div className={styles.header}>
                <div className={styles.title} onClick={async () => {}}>
                    <span className={styles.item}>Light</span>
                    <span className={styles.item}>GPT</span>
                </div>
                <div className={styles.description}>
                    Based on OpenAI API(gpt-3.5-turbo)
                </div>
                <div className={styles.menus}>
                    <div
                        className="themeToggleBtn"
                        onClick={() => {
                            setTheme(theme === 'light' ? 'dark' : 'light');
                            window.localStorage.setItem(
                                ThemeLocalKey,
                                theme === 'light' ? 'dark' : 'light'
                            );
                        }}
                    >
                        {theme === 'light' ? (
                            <i className="fas fa-moon"></i>
                        ) : (
                            <i className="fas fa-sun"></i>
                        )}
                    </div>
                    <i
                        className="fas fa-cog"
                        onClick={() => {
                            setSystemMenuVisible((visible) => !visible);
                        }}
                    ></i>

                    <i
                        className="fab fa-github"
                        onClick={() => {
                            window.open(
                                'https://github.com/riwigefi/light-gpt',
                                '_blank'
                            );
                        }}
                    ></i>
                    <i
                        className="fas fa-sign-out-alt"
                        onClick={() => {
                            signOut(auth).then(() => {
                                router.push(`/login`);
                            });
                        }}
                    ></i>
                </div>
            </div>
            <div className={styles.main}>
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
                            />
                        ))}
                    {loading && currentAssistantMessage.length > 0 && (
                        <MessageItem
                            id={uuid()}
                            role={ERole.assistant}
                            avatar={robotAvatar}
                            message={currentAssistantMessage}
                        />
                    )}
                    <div className={styles.placeholder}>
                        <div className={styles.child}></div>
                    </div>
                </div>
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
                                        chatGPTTurboWithLatestUserPrompt(true)
                                    }
                                >
                                    Regenerate
                                </div>
                            )}
                        </div>
                        <textarea
                            className={styles.userPrompt}
                            onChange={(e) => {
                                setCurrentUserMessage(e.target.value);
                            }}
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
                            }}
                            value={currentUserMessage}
                            ref={(e) => {
                                userPromptRef.current = e;
                            }}
                            placeholder={
                                loading
                                    ? 'light-gpt is thinking...'
                                    : 'ask light-gpt for anything...'
                            }
                            rows={1}
                            onKeyDown={(event) => {
                                // event.key 的值不受操作系统和键盘布局的影响，它始终表示按下的是哪个字符键。
                                // pc端
                                if (
                                    !windowState.current.isMobile &&
                                    (event.code === 'Enter' ||
                                        event.code === 'Done')
                                ) {
                                    event.preventDefault();
                                    if (windowState.current.isUsingComposition)
                                        return;
                                    chatGPTTurboWithLatestUserPrompt(false);
                                }
                                // 移动端
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
                            onCompositionStart={(e) => {
                                windowState.current.isUsingComposition = true;
                            }}
                            onCompositionEnd={(e) => {
                                windowState.current.isUsingComposition = false;
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
                                        chatGPTTurboWithLatestUserPrompt(false)
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
            <div
                className={`${styles.extraFunction} ${
                    !messageList.length && styles.noMessage
                }`}
            >
                <i className="fas fa-image" onClick={convertToImage}></i>
                <i className="fas fa-file-pdf" onClick={convertToPDF}></i>
                <i
                    className="fas fa-trash-alt"
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

            {/** 模态框 */}
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
                            title="Robot Avatar Settings"
                            img={robotAvatar}
                            updateAvatar={updateRobotAvatar}
                        />
                    )}
                    {activeSystemMenu ===
                        SystemSettingMenu.userAvatarSettings && (
                        <AvatarUploader
                            title="User Avatar Settings"
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
                                System role refers to the role identity in the
                                generated text, which can be different
                                characters, robots, or other entities. By
                                setting different system roles, you can control
                                the emotions and tone of the generated text to
                                better adapt to the needs of specific scenarios.
                            </div>

                            <div className={styles.benefits}>
                                Do not know how to define system role? Come{' '}
                                <Link
                                    href="https://github.com/f/awesome-chatgpt-prompts"
                                    target="_blank"
                                >
                                    Awesome ChatGPT Prompts
                                </Link>{' '}
                                to choose the system role you want
                            </div>
                            <div className={styles.btnContainer}>
                                <button
                                    className={styles.saveButton}
                                    onClick={() => {
                                        setActiveSystemMenu('');
                                        setSystemMenuVisible(false);
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
                                    Save
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
                                Please enter your API key, which will ensure
                                that your assistant runs faster and better.
                                <strong>
                                    Rest assured that the API key you enter will
                                    not be uploaded to our server, but will only
                                    be stored locally in your browser, with no
                                    risk of leakage. We will do our utmost to
                                    protect your privacy and data security.
                                </strong>
                            </div>

                            <div className={styles.benefits}>
                                Do not know how to get your api key?If you have
                                a Open AI account, please visit{' '}
                                <Link
                                    href="https://platform.openai.com/account/api-keys"
                                    target="_blank"
                                >
                                    Open AI Platform API keys
                                </Link>{' '}
                                to to view your API key list.If you do not have
                                a chatGPT account, please click the button below
                                to get a temporary API key, which may have slow
                                access speed. Therefore, to ensure faster
                                conversation, please use your own API key as
                                much as possible.
                            </div>
                            <div className={styles.btnContainer}>
                                <button
                                    className={styles.saveButton}
                                    onClick={() => {
                                        setActiveSystemMenu('');
                                        setSystemMenuVisible(false);
                                        setApiKey(tempApiKeyValue);
                                        window.localStorage.setItem(
                                            APIKeyLocalKey,
                                            tempApiKeyValue
                                        );
                                        toast.success('Successful update', {
                                            autoClose: 1000,
                                        });
                                    }}
                                >
                                    Save
                                </button>
                                {/* <button
                                    className={styles.saveButton}
                                    onClick={() => {
                                      
                                        setActiveSystemMenu('');
                                    }}
                                >
                                    Get API Key
                                </button> */}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/** 生成图片、pdf的简单loading */}
            {isGenerateFile && (
                <div className={styles.loading}>
                    <div className={styles.loadingSpinner}></div>
                </div>
            )}
        </div>
    );
}

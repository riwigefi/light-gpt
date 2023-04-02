import React, { useState, useEffect, useRef } from 'react';

import { toast } from 'react-toastify';

import { v4 as uuid } from 'uuid';

import { ChatService } from '../../../db';

import { ERole, IMessage } from '../../../interface';

import styles from './index.module.scss';

const chatDB = new ChatService();

const HistoryTopicList: React.FC<{
    historyTopicListVisible: boolean;
    currentMessageList: IMessage[];
    updateCurrentMessageList: (messages: IMessage[]) => void;
    activeTopicId: string;
    changeActiveTopicId: (id: string) => void;
    showMask: () => void;
    hideMask: () => void;
}> = ({
    historyTopicListVisible,
    currentMessageList,
    updateCurrentMessageList,
    activeTopicId,
    changeActiveTopicId,
    showMask,
    hideMask,
}) => {
    const [historyTopicList, setHistoryTopicList] = useState<
        { id: string; name: string }[]
    >([]);

    const generateTopic = () => {
        const topicId = uuid();

        const topicName = `Chat ${topicId.slice(0, 6)}`;

        const topic = {
            id: topicId,
            name: topicName,
            createdAt: Date.now(),
        };

        chatDB.addTopic(topic);
        let newHistoryTopicList = historyTopicList.concat([]);
        newHistoryTopicList.unshift(topic);
        setHistoryTopicList(newHistoryTopicList);
        changeActiveTopicId(topicId);
        updateCurrentMessageList([]);
    };

    const prevHistoryTopicCount = useRef(0);

    useEffect(() => {
        const updateCurrentTopicNameAfterChat = async () => {
            if (
                currentMessageList.length !== 0 &&
                currentMessageList.length !== prevHistoryTopicCount.current &&
                activeTopicId
            ) {
                const latestUserMessage =
                    currentMessageList
                        .slice()
                        .reverse()
                        .find((item) => item.role === ERole.user)?.content ||
                    '';
                const newTopicName = latestUserMessage.slice(0, 10);
                await chatDB.updateTopicNameById(activeTopicId, newTopicName);
                setHistoryTopicList((list) =>
                    list.map((o) =>
                        o.id === activeTopicId
                            ? { ...o, name: newTopicName }
                            : o
                    )
                );
                prevHistoryTopicCount.current = currentMessageList.length;
            }
        };
        updateCurrentTopicNameAfterChat();
    }, [currentMessageList, activeTopicId]);

    useEffect(() => {
        const init = async () => {
            const topics = await chatDB.getTopics();

            if (topics.length === 0) {
                // 生成一个新对话
                const topicId = uuid();

                const topicName = `Chat ${topicId.slice(0, 6)}`;

                const topic = {
                    id: topicId,
                    name: topicName,
                    createdAt: Date.now(),
                };

                chatDB.addTopic(topic);
                let newHistoryTopicList = [];
                newHistoryTopicList.unshift(topic);
                changeActiveTopicId(topicId);
                updateCurrentMessageList([]);
                setHistoryTopicList(newHistoryTopicList);
                return;
            }

            setHistoryTopicList(topics);
            changeActiveTopicId(topics[0].id);

            showMask();
            // 找出点击的主题的历史对话
            const currentMessageList = await chatDB.getConversationsByTopicId(
                topics[0].id
            );
            updateCurrentMessageList(currentMessageList as IMessage[]);

            hideMask();
        };
        init();
    }, [changeActiveTopicId, updateCurrentMessageList, hideMask, showMask]);

    const [editingTopicName, setEditingTopicName] = useState(false);
    const [tempTopicName, setTempTopicName] = useState('');

    const [removingTopic, setRemovingTopic] = useState(false);

    useEffect(() => {
        setEditingTopicName(false);
        setRemovingTopic(false);
    }, [activeTopicId]);

    return (
        <>
            <div
                className={`${styles.newChatBtn} ${
                    !historyTopicListVisible && styles.hide
                }`}
                onClick={() => {
                    // 新建对话
                    generateTopic();
                }}
            >
                <i className="fas fa-plus"></i>
                <span>New Chat</span>
            </div>
            <div
                className={`${styles.historyTopicList}  ${
                    !historyTopicListVisible && styles.hide
                }`}
            >
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
                                    changeActiveTopicId(item.id);

                                    showMask();
                                    // 找出点击的主题的历史对话
                                    const currentMessageList =
                                        await chatDB.getConversationsByTopicId(
                                            item.id
                                        );
                                    updateCurrentMessageList(
                                        currentMessageList as IMessage[]
                                    );

                                    hideMask();
                                }}
                            >
                                {editingTopicName && isActive ? (
                                    <div className={styles.inputContainer}>
                                        <input
                                            className={styles.editingTopicName}
                                            type="text"
                                            value={tempTopicName}
                                            onChange={(e) => {
                                                setTempTopicName(
                                                    e.target.value
                                                );
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <i className="fas fa-comment"></i>
                                        <div className={styles.topicName}>
                                            {item.name}
                                        </div>
                                    </>
                                )}
                                <div
                                    className={styles.action}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    {(editingTopicName || removingTopic) &&
                                    isActive ? (
                                        <>
                                            <i
                                                className="fas fa-check"
                                                onClick={async () => {
                                                    if (editingTopicName) {
                                                        // 更新主题名字
                                                        await chatDB.updateTopicNameById(
                                                            item.id,
                                                            tempTopicName
                                                        );
                                                        setHistoryTopicList(
                                                            (list) =>
                                                                list.map((o) =>
                                                                    o.id ===
                                                                    item.id
                                                                        ? {
                                                                              ...o,
                                                                              name: tempTopicName,
                                                                          }
                                                                        : o
                                                                )
                                                        );
                                                        toast.success(
                                                            'Update Topic Name Successful',
                                                            {
                                                                autoClose: 1000,
                                                            }
                                                        );
                                                    }
                                                    if (removingTopic) {
                                                        await chatDB.deleteTopicById(
                                                            item.id
                                                        );
                                                        setHistoryTopicList(
                                                            (list) =>
                                                                list.filter(
                                                                    (o) =>
                                                                        o.id !==
                                                                        item.id
                                                                )
                                                        );
                                                        updateCurrentMessageList(
                                                            []
                                                        );
                                                        changeActiveTopicId('');
                                                        toast.success(
                                                            'Successful deleted topic',
                                                            {
                                                                autoClose: 1000,
                                                            }
                                                        );
                                                    }
                                                    setEditingTopicName(false);
                                                    setRemovingTopic(false);
                                                }}
                                            ></i>
                                            <i
                                                className="fas fa-times"
                                                onClick={() => {
                                                    setEditingTopicName(false);
                                                    setRemovingTopic(false);
                                                }}
                                            ></i>
                                        </>
                                    ) : (
                                        <>
                                            <i
                                                className="fas fa-pencil"
                                                onClick={() => {
                                                    setEditingTopicName(true);
                                                    setTempTopicName(item.name);
                                                }}
                                            ></i>
                                            <i
                                                className="fas fa-trash"
                                                onClick={async () => {
                                                    setRemovingTopic(true);
                                                }}
                                            ></i>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default HistoryTopicList;

import React, { useState, useEffect } from 'react';

import { toast } from 'react-toastify';

import { v4 as uuid } from 'uuid';

import { ChatService } from '../../../db';

import { IMessage, ERole } from '../../../interface';

import styles from './index.module.scss';

const chatDB = new ChatService();

const HistoryTopicList: React.FC<{
    historyTopicListVisible: boolean;
    toggleHistoryTopicListVisible: () => void;
    currentMessageList: IMessage[];
    updateCurrentMessageList: (messages: IMessage[]) => void;
    activeTopicId: string;
    changeActiveTopicId: (id: string) => void;
    showMask: () => void;
    hideMask: () => void;
}> = ({
    historyTopicListVisible,
    toggleHistoryTopicListVisible,
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
        if (currentMessageList.length === 0) return;
        const topicName =
            currentMessageList
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
        currentMessageList.forEach((message) => {
            chatDB.addConversation({
                topicId: topicId,
                id: message.id,
                role: message.role,
                content: message.content,
                createdAt: message.createdAt,
            });
        });
        updateCurrentMessageList([]);
    };

    useEffect(() => {
        chatDB.getTopics().then((topics) => {
            setHistoryTopicList(topics || []);
        });
    }, []);

    return (
        <>
            <div
                className={styles.historyTopicListVisibleToggle}
                onClick={() => toggleHistoryTopicListVisible()}
            >
                {historyTopicListVisible ? (
                    <i className="fas fa-chevron-left"></i>
                ) : (
                    <i className="fas fa-chevron-right"></i>
                )}
            </div>
            <div
                className={`${styles.newChatBtn} ${
                    !historyTopicListVisible && styles.hide
                }`}
                onClick={() => {
                    if (activeTopicId) {
                        changeActiveTopicId('');
                        updateCurrentMessageList([]);
                        return;
                    }
                    // 新建主题，将当前对话信息存储在新建的主题下，然后清空messageList
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
                                    if (activeTopicId === '') {
                                        generateTopic();
                                    }
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
                                <i className="fas fa-comment"></i>
                                <div className={styles.topicName}>
                                    {item.name}
                                </div>
                                <i
                                    className={`fas fa-times ${styles.remove}`}
                                    onClick={async () => {
                                        await chatDB.deleteTopicById(item.id);
                                        setHistoryTopicList((list) =>
                                            list.filter((o) => o.id !== item.id)
                                        );
                                        updateCurrentMessageList([]);
                                        changeActiveTopicId('');
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
        </>
    );
};

export default HistoryTopicList;

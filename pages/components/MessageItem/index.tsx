import React from 'react';

import MarkdownIt from 'markdown-it';

import Image from 'next/image';

// @ts-ignore
import MdKatex from 'markdown-it-katex';

import MdHighlight from 'markdown-it-highlightjs';

import Highlightjs from 'highlight.js';

import { ERole } from '../../interface';

import styles from './index.module.scss';

const MessageItem: React.FC<{
    role: ERole;
    message: string;
    avatar?: string;
    showRetry?: boolean;
    onRetry?: () => void;
}> = ({ role, message, avatar, showRetry, onRetry }) => {
    const htmlString = () => {
        const md = MarkdownIt().use(MdKatex).use(MdHighlight, {
            hljs: Highlightjs,
        });
        const fence = md.renderer.rules.fence;
        if (!fence) return '';
        md.renderer.rules.fence = (...args) => {
            const [tokens, idx] = args;
            const token = tokens[idx];
            const rawCode = fence(...args);
            return `<div class='container'>
        <div data-code=${encodeURIComponent(token.content)}>
        </div>
        ${rawCode}
        </div>`;
        };
        return md.render(message);
    };

    return (
        <div className={styles.message}>
            {role === ERole.user ? (
                <>
                    <div className={`${styles.user} ${styles.avatar}`}>
                        {avatar && (
                            <Image
                                className={styles.img}
                                width={40}
                                height={40}
                                src={avatar}
                                alt="user"
                            />
                        )}
                    </div>
                    <div
                        className={styles.content}
                        dangerouslySetInnerHTML={{
                            __html: htmlString(),
                        }}
                    ></div>
                    <div className={styles.placeholder}></div>
                </>
            ) : (
                <>
                    <div className={styles.placeholder}></div>
                    <div
                        className={styles.content}
                        dangerouslySetInnerHTML={{
                            __html: htmlString(),
                        }}
                    ></div>
                    <div className={`${styles.assistant} ${styles.avatar}`}>
                        {avatar && (
                            <Image
                                className={styles.img}
                                width={40}
                                height={40}
                                src={avatar}
                                alt="robot"
                            />
                        )}
                    </div>
                </>
            )}
            {showRetry && onRetry && (
                <div className={styles.regenerateBtn} onClick={onRetry}>
                    Regenerate
                </div>
            )}
        </div>
    );
};

export default React.memo(MessageItem);

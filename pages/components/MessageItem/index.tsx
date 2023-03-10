import React, { useState, useEffect } from 'react';

import MarkdownIt from 'markdown-it';

import Image from 'next/image';

// @ts-ignore
import MdKatex from 'markdown-it-katex';

import MdHighlight from 'markdown-it-highlightjs';

import Highlightjs from 'highlight.js';

import copy from 'react-copy-to-clipboard';

import { ERole } from '../../../interface';

import styles from './index.module.scss';

async function copyTextToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        console.log('Text copied to clipboard');
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
}

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
            return `<div class='highlight-js-pre-container'>
        <div class="copy" data-code=${encodeURIComponent(token.content)}>
        <i class="fa fa-clipboard" aria-hidden="true"></i> ${
            copied ? 'copied' : 'copy'
        }
        </div>
        ${rawCode}
        </div>`;
        };
        return md.render(message || '');
    };

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        window.addEventListener('click', (e) => {
            const el = e.target as HTMLElement;
            let code = '';

            if (el.matches('div.highlight-js-pre-container > div.copy')) {
                code = decodeURIComponent(el.dataset.code!);
            }
            if (el.matches('div.highlight-js-pre-container > div.copy > i')) {
                code = decodeURIComponent(el.parentElement?.dataset.code!);
            }

            // 创建一个新的ClipboardItem对象
            const item = new ClipboardItem({
                'text/plain': new Blob([code], { type: 'text/plain' }),
            });

            // 将ClipboardItem对象写入系统剪切板
            navigator.clipboard
                .write([item])
                .then(() => {
                    // console.log('已成功复制到剪切板')
                    setCopied(true);
                })
                .catch((err) => {
                    // console.error('复制到剪切板失败：', err)
                    setCopied(false);
                });
        });
    }, []);

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

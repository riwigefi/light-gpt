import React, { useState, useEffect, useRef } from 'react';

import { v4 as uuid } from 'uuid';

import { toast } from 'react-toastify';

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
    id: string;
    role: ERole;
    message: string;
    avatar?: string;
    showRetry?: boolean;
    onRetry?: () => void;
}> = ({ role, message, avatar, showRetry, onRetry }) => {
    const currentMessageEle = useRef<HTMLDivElement | null>(null);

    const htmlString = () => {
        const md = MarkdownIt().use(MdKatex).use(MdHighlight, {
            hljs: Highlightjs,
        });
        const fence = md.renderer.rules.fence;
        if (!fence) return '';
        const id = uuid();
        md.renderer.rules.fence = (...args) => {
            const [tokens, idx] = args;
            const token = tokens[idx];
            const rawCode = fence(...args);
            return `<div class='highlight-js-pre-container'>
        <div id class="copy" data-code=${encodeURIComponent(token.content)}>
        <i class="fa fa-clipboard" aria-hidden="true"></i> 
        </div>
        ${rawCode}
        </div>`;
        };
        return md.render(message || '');
    };

    useEffect(() => {
        if (!currentMessageEle.current) return;
        const faClipboardIList =
            currentMessageEle.current.querySelectorAll('.copy');
        if (faClipboardIList.length === 0) return;
        const clickHandler = (e: Event) => {
            e.stopPropagation();
            const el = e.currentTarget as HTMLElement;
            let code = '';

            // console.log('点击复制', el);
            code = decodeURIComponent(el.dataset.code || '');
            // 创建一个新的ClipboardItem对象
            navigator.clipboard
                .writeText(code)
                .then(() => {
                    toast.success('code copied', { autoClose: 1000 });
                })
                .catch((err) => {
                    // console.error('写入剪贴板失败：', err)
                });
        };
        faClipboardIList.forEach((item) => {
            if (!item) return;
            item.addEventListener('click', clickHandler);
        });
        return () => {
            faClipboardIList.forEach((item) => {
                if (!item) return;
                item.removeEventListener('click', clickHandler);
            });
        };
    }, []);

    return (
        <div
            className={styles.message}
            ref={(ele) => (currentMessageEle.current = ele)}
        >
            {role === ERole.user ? (
                <>
                    <div className={styles.placeholder}></div>
                    <div
                        className={styles.content}
                        dangerouslySetInnerHTML={{
                            __html: htmlString(),
                        }}
                    ></div>
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
                </>
            ) : (
                <>
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
                    <div
                        className={styles.content}
                        dangerouslySetInnerHTML={{
                            __html: htmlString(),
                        }}
                    ></div>
                    <div className={styles.placeholder}></div>
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

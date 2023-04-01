import React, { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { getCurrentApiKeyBilling } from '../../../open.ai.service';

import { Theme } from '../../../interface';

import { ThemeLocalKey, formatTimestamp } from '../../../utils';

import styles from './index.module.scss';

import Link from 'next/link';

const IndexHeader: React.FC<{
    apiKey: string;
    theme: Theme;
    updateTheme: (theme: Theme) => void;
    toggleSystemMenuVisible: () => void;
}> = ({ apiKey }) => {
    const { t } = useTranslation();

    const [currentApiKeyBilling, setCurrentApiKeyBilling] = useState({
        totalGranted: 0,
        totalAvailable: 0,
        totalUsed: 0,
        expiresAt: '',
    });

    useEffect(() => {
        if (!apiKey) return;
        const getCurrentBilling = async () => {
            const res = await getCurrentApiKeyBilling(apiKey);
            if (res.total_granted) {
                setCurrentApiKeyBilling({
                    totalGranted: res.total_granted,
                    totalAvailable: res.total_available,
                    totalUsed: res.total_used,
                    expiresAt: formatTimestamp(
                        res.grants?.data?.[0]?.expires_at
                    ),
                });
            }
        };
        getCurrentBilling();
        const timer = setInterval(() => {
            getCurrentBilling();
        }, 1000 * 60 * 60 * 6);
        return () => {
            clearInterval(timer);
        };
    }, [apiKey]);

    return (
        <div className={styles.headerContainer}>
            <div className={styles.currentApiKeyBilling}>
            </div>

            <div className={styles.siteIntroduction}>
                <div className={styles.title}>
                    <span className={styles.item}>ai.yiios.com</span>
                    <span className={styles.item}>小鱼智能客服</span>
                </div>
                <div className={styles.description}>
                        智能连接用户，全场景赋能客服
                    </div>
            </div>
            <div className={styles.sideMenus}>
                <i
                    className="fas fa-comment-dots"
                    onClick={() => {
                        window.open(
                            'https://yiios.com/post/about/',
                            '_blank'
                        );
                    }}
                ></i>
            </div>
        </div>
    );
};

export default IndexHeader;

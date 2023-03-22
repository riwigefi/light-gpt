import React, { useState, useEffect } from 'react';

import { getCurrentApiKeyBilling } from '../../../open.ai.service';

import { Theme } from '../../../interface';

import { ThemeLocalKey } from '../../../utils';

import styles from './index.module.scss';

const IndexHeader: React.FC<{
    apiKey: string;
    theme: Theme;
    updateTheme: (theme: Theme) => void;

    toggleSystemMenuVisible: () => void;
}> = ({ apiKey, theme, updateTheme, toggleSystemMenuVisible }) => {
    const [currentApiKeyBilling, setCurrentApiKeyBilling] = useState({
        totalGranted: 0,
        totalAvailable: 0,
        totalUsed: 0,
    });

    useEffect(() => {
        if (!apiKey) return;
        getCurrentApiKeyBilling(apiKey).then((res) => {
            if (res.total_granted) {
                setCurrentApiKeyBilling({
                    totalGranted: res.total_granted,
                    totalAvailable: res.total_available,
                    totalUsed: res.total_used,
                });
            }
        });
    }, [apiKey]);

    return (
        <div className={styles.headerContainer}>
            <div className={styles.currentApiKeyBilling}>
                <div className={styles.item}>
                    <div className={styles.label}>total_granted:</div>
                    {apiKey ? currentApiKeyBilling.totalGranted.toFixed(3) : 0}$
                </div>
                <div className={styles.item}>
                    <div className={styles.label}>total_available:</div>
                    {apiKey
                        ? currentApiKeyBilling.totalAvailable.toFixed(3)
                        : 0}
                    $
                </div>
                <div className={styles.item}>
                    <div className={styles.label}>total_used:</div>
                    {apiKey ? currentApiKeyBilling.totalUsed.toFixed(3) : 0}$
                </div>
            </div>

            <div className={styles.siteIntroduction}>
                <div className={styles.title}>
                    <span className={styles.item}>Light</span>
                    <span className={styles.item}>GPT</span>
                </div>
                <div className={styles.description}>
                    Based on OpenAI API(gpt-3.5-turbo)
                </div>
            </div>
            <div className={styles.sideMenus}>
                <div
                    className="themeToggleBtn"
                    onClick={() => {
                        updateTheme(theme === 'light' ? 'dark' : 'light');
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
                        toggleSystemMenuVisible();
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
            </div>
        </div>
    );
};

export default IndexHeader;

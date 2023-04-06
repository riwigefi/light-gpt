import React, { useState, useEffect } from 'react';

// import { useTranslation } from 'react-i18next';

// import { getCurrentApiKeyBilling } from '../../../open.ai.service';

import { Theme } from '../../../interface';

// import { ThemeLocalKey, formatTimestamp } from '../../../utils';

import styles from './index.module.scss';

const IndexHeader: React.FC<{
    apiKey: string;
    theme: Theme;
    updateTheme: (theme: Theme) => void;
}> = ({ apiKey }) => {
    // const { t } = useTranslation();

    // const [currentApiKeyBilling, setCurrentApiKeyBilling] = useState({
    //     totalGranted: 0,
    //     totalAvailable: 0,
    //     totalUsed: 0,
    //     expiresAt: '',
    // });

    // useEffect(() => {
    //     if (!apiKey) return;
    //     const getCurrentBilling = async () => {
    //         const res = await getCurrentApiKeyBilling(apiKey);
    //         if (res.total_granted) {
    //             setCurrentApiKeyBilling({
    //                 totalGranted: res.total_granted,
    //                 totalAvailable: res.total_available,
    //                 totalUsed: res.total_used,
    //                 expiresAt: formatTimestamp(
    //                     res.grants?.data?.[0]?.expires_at
    //                 ),
    //             });
    //         }
    //     };
    //     getCurrentBilling();
    //     const timer = setInterval(() => {
    //         getCurrentBilling();
    //     }, 1000 * 60 * 60 * 6);
    //     return () => {
    //         clearInterval(timer);
    //     };
    // }, [apiKey]);

    return (
        <div className={styles.headerContainer}>
            <div className={styles.currentApiKeyBilling}>
                {/** 官方api变动，不再能获取账单 */}
                {/* <div className={styles.item}>
                    <div className={styles.label}>{t('totalGranted')}:</div>
                    {apiKey ? currentApiKeyBilling.totalGranted.toFixed(3) : 0}$
                </div>
                <div className={styles.item}>
                    <div className={styles.label}>{t('totalAvailable')}:</div>
                    {apiKey
                        ? currentApiKeyBilling.totalAvailable.toFixed(3)
                        : 0}
                    $
                </div>
                <div className={styles.item}>
                    <div className={styles.label}>{t('totalUsed')}:</div>
                    {apiKey ? currentApiKeyBilling.totalUsed.toFixed(3) : 0}$
                </div>
                <div className={styles.item}>
                    <div className={styles.label}>{t('expiresAt')}:</div>
                    {apiKey ? currentApiKeyBilling.expiresAt : '未知'}
                </div> */}
            </div>

            <div className={styles.siteIntroduction}>
                <div className={styles.title}>
                    <span className={styles.item}>Light</span>
                    <span className={styles.item}>GPT</span>
                </div>
                <div className={styles.description}>Based on gpt-3.5-turbo</div>
            </div>
            <div className={styles.sideMenus}>
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

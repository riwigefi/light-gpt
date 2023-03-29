import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import '@/styles/globals.scss';
import 'normalize.css';

import i18n from '../i18n';

function App({ Component, pageProps }: AppProps) {
    // 设置默认语言
    i18n.changeLanguage('zh');

    useEffect(() => {
        if (
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            )
        ) {
            const app = document.querySelector('#app') as HTMLElement;
            const appAside = document.querySelector('#appAside') as HTMLElement;
            if (!app || !appAside) return;
            app.style.height = window.innerHeight + 'px';
            appAside.style.height = window.innerHeight + 'px';
        }
    }, []);
    return <Component {...pageProps} />;
}

export default appWithTranslation(App);

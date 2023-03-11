import '@/styles/globals.scss';
import 'normalize.css';

// code hight
import 'highlight.js/styles/atom-one-dark.css';

import type { AppProps } from 'next/app';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
    useEffect(() => {
        if (
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            )
        ) {
            const app = document.querySelector('#app') as HTMLElement;
            if (!app) return;
            app.style.height = window.innerHeight + 'px';
        }
    }, []);
    return <Component {...pageProps} />;
}

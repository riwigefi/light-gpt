import '@/styles/globals.scss';
import 'normalize.css';

// code hight
import 'highlight.js/styles/atom-one-dark.css';

import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}

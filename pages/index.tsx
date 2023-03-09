import { useState } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';

import styles from '@/styles/Home.module.scss';

export default function Home() {
    const [apiKey, setApiKey] = useState('');

    const handleGetApiKey = async () => {
        const response = await fetch('/api/get_available_api_key');
        const data = await response.json();
        setApiKey(data.apiKey);
    };

    return (
        <div className={styles.app}>
            <div className={styles.header}></div>
            <div className={styles.main}>
                <h1>Home Page</h1>
                <button onClick={handleGetApiKey}>Get Available Key</button>
                <p>Available Key: {apiKey}</p>
                <i className="fas fa-sun" style={{ transform: 'scale(2)' }}></i>
                <i
                    className="fas fa-moon"
                    style={{ transform: 'scale(2)' }}
                ></i>
                <i
                    className="fas fa-image"
                    style={{ transform: 'scale(2)' }}
                ></i>
                <i
                    className="fas fa-file-pdf"
                    style={{ transform: 'scale(2)' }}
                ></i>
                <i className="fas fa-cog" style={{ transform: 'scale(2)' }}></i>
                <i
                    className="fab fa-github"
                    style={{ transform: 'scale(2)' }}
                ></i>
                <i
                    className="fas fa-paper-plane"
                    style={{ transform: 'scale(2)' }}
                ></i>
            </div>
            <div className={styles.footer}></div>
        </div>
    );
}

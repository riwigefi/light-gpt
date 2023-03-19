// Login.tsx

import React, { useState } from 'react';

import { signInWithEmailAndPassword } from 'firebase/auth';

import { useRouter } from 'next/router';

import { toast } from 'react-toastify';

import { auth } from '../../../firebase';

import styles from './index.module.scss';

const Login: React.FC = () => {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            if (userCredential.user && auth.currentUser) {
                // Do something after successful login, such as redirecting to another page
                router.push('/');
            }
        } catch (error: any) {
            console.error(error);
            setError(error.message);
        }
    };

    return (
        <div className={styles.container}>
            <div className="tip"></div>
            <form className={styles.form} onSubmit={handleLogin}>
                <h1 className={styles.title}>Chat With Open AI</h1>
                <div className={styles.inputContainer}>
                    <label htmlFor="email" className={styles.label}>
                        Email Address
                    </label>
                    <input
                        onChange={(event) => setEmail(event.target.value)}
                        type="email"
                        id="email"
                        className={styles.input}
                    />
                </div>
                <div className={styles.inputContainer}>
                    <label htmlFor="password" className={styles.label}>
                        Password
                    </label>
                    <input
                        onChange={(event) => setPassword(event.target.value)}
                        type="password"
                        id="password"
                        className={styles.input}
                    />
                </div>
                <button type="submit" className={styles.button}>
                    Sign In
                </button>
                <p className={styles.forgotPassword}>Forgot your password?</p>
                {error && <p className={styles.error}>{error}</p>}
            </form>
        </div>
    );
};

export default Login;

// Register.tsx

import React, { useState } from 'react';

import { useRouter } from 'next/router';

import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    updateProfile,
} from 'firebase/auth';

import { auth } from '../../../firebase';

import styles from './index.module.scss';

const Register: React.FC = () => {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
    };

    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
    };

    const handlePasswordChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setPassword(event.target.value);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            if (userCredential.user && auth.currentUser) {
                // Do something after successful registration, such as redirecting to another page
                updateProfile(auth.currentUser, {
                    displayName: name,
                }).then(() => {
                    router.push('/');
                });
            }
        } catch (error: any) {
            setError(error.message);
        }
    };

    return (
        <div className={styles.container}>
            <form className={styles.form} onSubmit={handleSubmit}>
                <h1 className={styles.title}>Chat With Open AI </h1>
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.inputContainer}>
                    <label htmlFor="name" className={styles.label}>
                        Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        className={styles.input}
                        value={name}
                        onChange={handleNameChange}
                    />
                </div>
                <div className={styles.inputContainer}>
                    <label htmlFor="email" className={styles.label}>
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        className={styles.input}
                        value={email}
                        onChange={handleEmailChange}
                    />
                </div>
                <div className={styles.inputContainer}>
                    <label htmlFor="password" className={styles.label}>
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        className={styles.input}
                        value={password}
                        onChange={handlePasswordChange}
                    />
                </div>
                <button type="submit" className={styles.button}>
                    Sign Up
                </button>
            </form>
        </div>
    );
};

export default Register;

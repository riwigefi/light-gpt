import React, { useState } from 'react';

import Login from './components/Login';
import Register from './components/Register';

import styles from '@/styles//Login.module.scss';

const LoginAndRegisterPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className={styles.loginAndRegister}>
            <div className={styles.tip}>
                {isLogin ? (
                    <div>
                        Not a member?
                        <span
                            onClick={() => {
                                setIsLogin(false);
                            }}
                        >
                            Sign up now
                        </span>
                    </div>
                ) : (
                    <div>
                        Already a member?{' '}
                        <span
                            onClick={() => {
                                setIsLogin(true);
                            }}
                        >
                            Sign In
                        </span>
                    </div>
                )}
            </div>
            <div className={`${styles.left} ${isLogin && styles.isLogin}`}>
                Light GPT
            </div>
            <div className={styles.right}>
                {isLogin ? (
                    <div className={styles.loginForm}>
                        <Login></Login>
                    </div>
                ) : (
                    <div className={styles.registerForm}>
                        <Register></Register>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginAndRegisterPage;

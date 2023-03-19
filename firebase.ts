// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, Auth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
import firebaseConfig from './firebaseConfig';

// Initialize Firebase
let app: FirebaseApp;
let analytics;
let auth: Auth;

if (typeof window !== 'undefined') {
    console.log('config--', firebaseConfig);

    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    auth = getAuth(app);
}

export type { Auth, FirebaseApp };

export { app, analytics, auth };

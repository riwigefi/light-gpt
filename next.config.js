const path = require('path');
const sass = require('sass');

/** @type {import('next').NextConfig} */
const nextConfig = {
    sassOptions: {
        includePaths: [path.join(__dirname, 'styles')],
        implementation: sass,
    },
    // async redirects() {
    //     return [
    //         {
    //             source: '/',
    //             destination: '/login',
    //             permanent: false,
    //         },
    //     ];
    // },
    env: {
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
            process.env.FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
            process.env.FIREBASE_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    },
};

module.exports = nextConfig;

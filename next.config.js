const path = require('path');
const sass = require('sass');

/** @type {import('next').NextConfig} */
const nextConfig = {
    sassOptions: {
        includePaths: [path.join(__dirname, 'styles')],
        implementation: sass,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'oaidalleapiprodscus.blob.core.windows.net',
                port: '',
                pathname: '/private/**',
            },
        ],
    },
};

module.exports = nextConfig;

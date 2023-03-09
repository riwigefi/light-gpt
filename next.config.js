const path = require('path');
const sass = require('sass');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    sassOptions: {
        includePaths: [path.join(__dirname, 'styles')],
        implementation: sass,
    },
};

module.exports = nextConfig;

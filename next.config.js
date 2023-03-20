const path = require('path');
const sass = require('sass');

/** @type {import('next').NextConfig} */
const nextConfig = {
    sassOptions: {
        includePaths: [path.join(__dirname, 'styles')],
        implementation: sass,
    },
};

module.exports = nextConfig;

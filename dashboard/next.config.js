const path = require('path');

// Load root .env so API_BACKEND_URL / Discord vars are available to rewrites
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const backend = process.env.API_BACKEND_URL || process.env.API_URL || 'http://127.0.0.1:4000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/auth/callback',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/callback`,
      },
    ];
  },
};

module.exports = nextConfig;

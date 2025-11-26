/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pwa-easy-rental/shared-ui', '@pwa-easy-rental/shared-services'],
  async rewrites() {
    return [
      {
        source: '/client/:path*',
        destination: 'http://localhost:3001/client/:path*',
      },
      {
        source: '/agency/:path*',
        destination: 'http://localhost:3002/agency/:path*',
      },
      {
        source: '/organisation/:path*',
        destination: 'http://localhost:3003/organisation/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

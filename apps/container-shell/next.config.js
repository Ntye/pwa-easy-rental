/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pwa-easy-rental/shared-ui', '@pwa-easy-rental/shared-services'],
  async rewrites() {
    return [
      {
        source: '/client/:path*',
        destination: 'http://localhost:3001/:path*',
      },
      {
        source: '/agency/:path*',
        destination: 'http://localhost:3002/:path*',
      },
      {
        source: '/organisation/:path*',
        destination: 'http://localhost:3003/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

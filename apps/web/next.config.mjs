/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@chess/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
    ],
  },
};

export default nextConfig;

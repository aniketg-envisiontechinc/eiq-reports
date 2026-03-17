import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.REPORTS_API_URL ?? 'http://localhost:3005'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

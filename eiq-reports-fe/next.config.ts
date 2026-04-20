import type { NextConfig } from 'next';

// Backend base URL for the /api proxy. Set NEXT_PUBLIC_BACKEND_URL at build
// time (e.g. http://eiq-reports-be:3005 inside k8s, or the public API host).
// Defaults to localhost:3005 for local dev.
const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3005').replace(/\/$/, '');

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

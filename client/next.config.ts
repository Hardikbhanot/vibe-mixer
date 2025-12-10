import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
    return [
      {
        source: '/auth/:path*',
        destination: `${apiUrl}/auth/:path*`,
      },
      {
        source: '/spotify/:path*',
        destination: `${apiUrl}/spotify/:path*`,
      },
      {
        source: '/ai/:path*',
        destination: `${apiUrl}/ai/:path*`,
      },
      {
        source: '/youtube/:path*',
        destination: `${apiUrl}/youtube/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

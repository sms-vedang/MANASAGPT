import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.31.140'],
  async rewrites() {
    return [
      {
        source: '/banner-welcome.jpg',
        destination: '/banner-welcome.svg',
      },
    ];
  },
};

export default nextConfig;

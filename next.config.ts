import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `http://167.71.125.132/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

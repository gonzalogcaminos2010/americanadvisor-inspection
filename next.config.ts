import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `https://api-inspeccion-api.2wxlnf.easypanel.host/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

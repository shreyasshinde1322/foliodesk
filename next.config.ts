import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/kdp/paperback-cover-calculator",
        destination: "/kdp-cover-calculator",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

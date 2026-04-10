import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@madecreative/shared"],
  // Disable Turbopack for production builds — lightningcss binary issue on Vercel
  experimental: {
    turbo: undefined,
  },
};

export default nextConfig;

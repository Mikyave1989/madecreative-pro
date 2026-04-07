import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@madecreative/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.madecreative.pro" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Exclude test files from the build
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(test|spec)\.(ts|tsx)$/,
      loader: "ignore-loader",
    });
    return config;
  },
};

export default nextConfig;

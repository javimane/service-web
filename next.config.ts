import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
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
  outputFileTracingRoot: require("path").join(process.cwd(), "./"),
};

export default nextConfig;

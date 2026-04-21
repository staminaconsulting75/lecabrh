import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // pdfkit charge ses polices (.afm) via des chemins relatifs
      // → il ne doit pas être bundlé par webpack, on le laisse en external
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "pdfkit",
      ];
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    return config;
  },
};

export default nextConfig;

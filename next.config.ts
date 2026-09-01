import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  devIndicators: false,
  ...(process.env.GITHUB_PAGES === "true"
    ? {
        basePath: "/taptrivia",
        assetPrefix: "/taptrivia/",
      }
    : {}),
};

export default nextConfig;

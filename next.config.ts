import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // Static export only for GitHub Pages. Vercel runs Next normally.
  ...(isGitHubPages
    ? {
        output: "export" as const,
        basePath: "/taptrivia",
        assetPrefix: "/taptrivia/",
      }
    : {}),
  images: { unoptimized: true },
  devIndicators: false,
};

export default nextConfig;

import type { NextConfig } from "next";

const twoGbServerMemoryBudgetBytes = 1536 * 1024 * 1024;

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    cpus: 2,
    memoryBasedWorkersCount: true,
    optimizePackageImports: ["lucide-react"],
    parallelServerBuildTraces: false,
    turbopackMemoryLimit: twoGbServerMemoryBudgetBytes,
    webpackMemoryOptimizations: true,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['@prisma/client'],
  turbopack: {}, // Enable Turbopack explicitly
};

export default nextConfig;

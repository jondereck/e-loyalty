import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.68.78"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;

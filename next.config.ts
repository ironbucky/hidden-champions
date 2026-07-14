import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  allowedDevOrigins: ["192.168.1.65"],
};

export default nextConfig;

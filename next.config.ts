import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configuración básica, sin turboMode, ya no es necesario.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false, // Evitar problemas con 'fs' en el cliente
      };
    }
    return config;
  },
};

export default nextConfig;

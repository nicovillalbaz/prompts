import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // <--- ¡ESTO ES LA CLAVE! (Estaba en true por defecto)
};

export default nextConfig;
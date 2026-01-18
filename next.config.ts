import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['lucide-react'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sjqbafovqiydkndodbsb.supabase.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: 'https',
        hostname: 'cdn.kkutu.co.kr',
        port: '',
        pathname: '/img/**',
      },
    ],
  },
};

export default nextConfig;

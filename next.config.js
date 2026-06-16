/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.unsplash.com", "avatars.githubusercontent.com"],
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
  // Faster builds
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // HTTP keep-alive for faster Supabase requests
  httpAgentOptions: {
    keepAlive: true,
  },
};

module.exports = nextConfig;

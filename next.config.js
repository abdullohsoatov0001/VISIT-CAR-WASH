/** @type {import('next').NextConfig} */
const nextConfig = {
  // Leaflet/leaflet-routing-machine не переживают двойной вызов эффектов
  // в dev Strict Mode (гонка: старый async-запрос маршрута падает на уже
  // удалённой карте). На прод-сборку это не влияет.
  reactStrictMode: false,
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

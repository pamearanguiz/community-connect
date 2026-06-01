import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Cache de componentes para mejor rendimiento (Next.js 16)
  cacheComponents: true,

  // Imágenes remotas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'files.communityconnect.cl',
      },
      {
        protocol: 'https',
        hostname: '**.clerk.com',
      },
    ],
  },
}

export default nextConfig

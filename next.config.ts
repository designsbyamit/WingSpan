import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'pdf-parse',
    'mammoth',
    '@prisma/client',
    'firebase-admin',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;

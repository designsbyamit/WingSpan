import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'pdf-parse',
    'mammoth',
    'xlsx',
    '@prisma/client',
    'groq-sdk',
    'google-auth-library',
    '@google/generative-ai',
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

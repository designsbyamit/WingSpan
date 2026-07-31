import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'pdf-parse',
    'pdfjs-dist',
    'canvas',
    'mammoth',
    '@prisma/client',
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

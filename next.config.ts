import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'pdf-parse',
    'pdfjs-dist',
    'canvas',
    'mammoth',
  ],
};

export default nextConfig;

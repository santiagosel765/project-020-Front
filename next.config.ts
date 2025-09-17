import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      // lo que ya tenías:
      { protocol: 'https', hostname: 'placehold.co', port: '', pathname: '/**' },
      // agrega tu bucket S3:
      {
        protocol: 'https',
        hostname: 's3-images-metag.s3.us-east-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Si usas Next 13–15 y notas problemas con URLs presignadas que cambian mucho,
    // puedes activar esto temporalmente:
    // unoptimized: true,
  },
};

export default nextConfig;

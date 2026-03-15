import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  transpilePackages: ['@lp-generator/sanity-schemas', '@lp-generator/ui', '@lp-generator/lp-blocks'],
}

export default nextConfig

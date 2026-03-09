import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ISR (Incremental Static Regeneration) を活用
  // 各FAQページは初回アクセス時にビルド、60秒ごとに再生成
  experimental: {
    // Next.js 15のPPR (Partial Prerendering) を有効化
    ppr: false,
  },
  // CORSヘッダー設定（埋め込みウィジェットからのアクセスを許可）
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
      {
        // FAQウィジェットJSファイルへのCORSアクセス許可
        source: '/widget.js',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' },
        ],
      },
    ];
  },
  // 画像最適化
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;

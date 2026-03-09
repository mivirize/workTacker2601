import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  build: {
    lib: {
      // Shadow DOMに埋め込むウィジェットのエントリポイント
      entry: 'src/embed.ts',
      name: 'FAQAIWidget',
      fileName: 'widget',
      formats: ['iife'], // 即時実行形式（<script>タグで読み込める）
    },
    rollupOptions: {
      output: {
        // インライン化でexternal依存なし
        inlineDynamicImports: true,
      },
    },
    // gzip後30KB以下を目標
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        passes: 2,
      },
    },
    reportCompressedSize: true,
    chunkSizeWarningLimit: 50, // 50KB警告
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

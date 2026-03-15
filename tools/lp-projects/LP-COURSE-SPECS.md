# LP制作コース仕様書

## コース比較表

| 項目 | Standard | Rich | Premium |
|------|----------|------|---------|
| **価格帯** | 30-50万円 | 80-120万円 | 150-300万円 |
| **制作期間** | 2-3週間 | 4-6週間 | 8-12週間 |
| **セクション数** | 5-7 | 8-12 | 12-20 |
| **ページ数** | 1ページ | 1-3ページ | 3-5ページ |
| **レスポンシブ** | ○ | ○ | ○ |
| **フォーム** | 基本 | カスタム | 高機能 |

---

## Standard コース

### 対象
- 初めてLPを作成する企業
- 予算を抑えたい案件
- シンプルな商品・サービス紹介

### 技術仕様

```
【HTML/CSS】
- セマンティックHTML5
- CSS3（Flexbox中心）
- CSS変数によるカラー管理
- メディアクエリ（3ブレークポイント）

【アニメーション】
- CSS Transition（hover効果）
- 基本的なフェードイン（IntersectionObserver）
- スムーススクロール

【JavaScript】
- Vanilla JS のみ
- 外部ライブラリなし
- ハンバーガーメニュー
- スムーススクロール
- フォームバリデーション（基本）

【画像】
- JPG/PNG（WebP対応推奨）
- 遅延読み込み（loading="lazy"）
- 最大5-10枚程度
```

### セクション構成（5-7）
1. ヒーロー（キャッチコピー + CTA）
2. 問題提起 / 悩み
3. 解決策 / サービス紹介
4. 特徴（3-4項目）
5. 料金 / プラン
6. よくある質問（FAQ）
7. CTA + フォーム

### LP-Editor対応
- 基本的なdata-editable
- シンプルなカラー変数（5-8色）
- リピートブロック：1-2箇所

---

## Rich コース

### 対象
- ブランディングを重視する企業
- 競合との差別化を図りたい案件
- 中規模キャンペーン

### 技術仕様

```
【HTML/CSS】
- セマンティックHTML5
- CSS3（Grid + Flexbox）
- CSS変数（カラー + スペーシング）
- カスタムプロパティ活用
- メディアクエリ（5ブレークポイント）

【アニメーション】
- CSS Animation（@keyframes）
- スクロールトリガーアニメーション
- パララックス効果（背景）
- ホバーインタラクション（リッチ）
- カウントアップアニメーション
- スライダー / カルーセル

【JavaScript】
- Vanilla JS（モジュール構成）
- IntersectionObserver（高度な使用）
- Swiper.js または自作スライダー
- フォームバリデーション（リアルタイム）
- スクロール進捗インジケーター

【画像】
- WebP優先（fallback付き）
- srcset対応
- 10-20枚程度
- アイコンはSVG
```

### セクション構成（8-12）
1. ヒーロー（動的背景 + キャッチ）
2. 問題提起（アニメーション付き）
3. 解決策
4. サービス詳細
5. 特徴・強み（アイコン付き）
6. 実績・数字（カウントアップ）
7. お客様の声（スライダー）
8. 導入フロー / ステップ
9. 料金プラン（比較表）
10. よくある質問（アコーディオン）
11. 会社概要
12. CTA + フォーム

### LP-Editor対応
- 詳細なdata-editable
- カラー変数（10-15色）
- リピートブロック：3-5箇所
- 画像最適化機能活用

---

## Premium コース

### 対象
- 大企業・高級ブランド
- 重要なプロダクトローンチ
- 最高品質を求める案件

### 技術仕様

```
【HTML/CSS】
- セマンティックHTML5
- CSS3（Grid + Flexbox + Subgrid）
- CSS変数（フルシステム）
- コンテナクエリ対応
- メディアクエリ（7+ブレークポイント）
- print対応

【アニメーション】
- GSAP（ScrollTrigger）
- Lottie / SVGアニメーション
- パーティクルエフェクト
- 3D Transform / Perspective
- マウストラッキング
- スクロールジャッキング（オプション）
- ページトランジション
- ローディングアニメーション

【JavaScript】
- TypeScript推奨
- モジュールバンドル（Vite）
- GSAP / ScrollTrigger
- Three.js（3D要素がある場合）
- Particles.js / tsparticles
- 高度なフォーム（マルチステップ）
- カスタムカーソル
- サウンドエフェクト（オプション）

【画像・メディア】
- WebP/AVIF
- レスポンシブイメージ完全対応
- ビデオ背景（MP4 + WebM）
- 20-40枚程度
- カスタムSVGイラスト
```

### セクション構成（12-20）
1. ローディング画面
2. ヒーロー（ビデオ or 3D背景）
3. ブランドストーリー
4. 問題提起（インタラクティブ）
5. ソリューション概要
6. 製品・サービス詳細
7. 特徴・強み（アニメーション付き）
8. 技術・こだわり
9. 実績・数字（ダイナミック）
10. ケーススタディ
11. お客様の声（リッチスライダー）
12. 導入フロー
13. 料金プラン（インタラクティブ）
14. 比較表
15. よくある質問
16. チーム紹介
17. 会社概要
18. ニュース・メディア掲載
19. CTA（インパクト大）
20. フッター（リッチ）

### LP-Editor対応
- 完全なdata-editable
- カラー変数（20+色）
- リピートブロック：5-10箇所
- マルチページ対応
- 画像最適化フル活用

---

## 共通技術要件

### パフォーマンス目標

| 指標 | Standard | Rich | Premium |
|------|----------|------|---------|
| LCP | < 2.5s | < 2.5s | < 3.0s |
| FID/INP | < 100ms | < 150ms | < 200ms |
| CLS | < 0.1 | < 0.1 | < 0.15 |
| PageSpeed | 90+ | 85+ | 80+ |

### SEO対応
- メタタグ（title, description）
- OGP対応
- 構造化データ（JSON-LD）
- サイトマップ（複数ページの場合）

### アクセシビリティ
- alt属性必須
- フォーカス管理
- 色コントラスト比（WCAG AA）
- キーボードナビゲーション

### ブラウザ対応
- Chrome（最新2バージョン）
- Firefox（最新2バージョン）
- Safari（最新2バージョン）
- Edge（最新2バージョン）
- iOS Safari（最新2バージョン）
- Android Chrome（最新2バージョン）

---

## ファイル構成

### Standard
```
project/
├── lp-config.json
├── src/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── main.js
│   └── images/
└── .lp-editor/
    └── content.json
```

### Rich
```
project/
├── lp-config.json
├── src/
│   ├── index.html
│   ├── contact.html（オプション）
│   ├── css/
│   │   ├── styles.css
│   │   └── animations.css
│   ├── js/
│   │   ├── main.js
│   │   └── slider.js
│   └── images/
└── .lp-editor/
    └── content.json
```

### Premium
```
project/
├── lp-config.json
├── src/
│   ├── index.html
│   ├── about.html
│   ├── contact.html
│   ├── css/
│   │   ├── styles.css
│   │   ├── animations.css
│   │   └── components.css
│   ├── js/
│   │   ├── main.js
│   │   ├── animations.js
│   │   ├── slider.js
│   │   └── particles.js
│   ├── images/
│   └── videos/
└── .lp-editor/
    └── content.json
```

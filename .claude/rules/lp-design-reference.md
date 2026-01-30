# LP Design Reference 2026

LP作成時に参照する最新Webデザイントレンドとベストプラクティス集。

---

## 1. デザイントレンド 2026

### 1.1 ビジュアルスタイル

| トレンド | 説明 | 実装例 |
|---------|------|--------|
| **ガラスモーフィズム** | 半透明、ぼかし効果のUI | `backdrop-filter: blur(10px); background: rgba(255,255,255,0.1)` |
| **Bento Grid** | 弁当箱型のモジュラーレイアウト | `grid-template-areas` で可変サイズのカード配置 |
| **デジタルテクスチャ** | ゼリー、クローム、クレイ質感のUI | 3D効果、膨張アイコン、押すと変形するボタン |
| **ボールドカラー** | 大胆なグラデーション、ネオン | Electric Neon, Sunset Coral, Holographic Silver |
| **ダークモード優先** | 深い黒＋アクセントカラー | `#0a0a1a` + 発光するアクセント色 |

### 1.2 タイポグラフィ

| トレンド | 説明 | 実装 |
|---------|------|------|
| **キネティックタイポグラフィ** | アニメーションする見出し | スクロール連動でストレッチ、バウンス、液体化 |
| **可変フォント** | 太さ、幅がダイナミックに変化 | `font-variation-settings` |
| **大胆な見出し** | 超大型タイトル | `clamp(3rem, 10vw, 8rem)` |

### 1.3 高級ブランド向け特有

| 要素 | ポイント |
|------|----------|
| **ミニマリスト** | 余白を十分に取る、情報を絞る |
| **ホワイトスペース** | 商品が呼吸できる空間 |
| **高品質ビデオ** | ヒーローセクションに自動再生動画 |
| **ローディングアニメーション** | 高級感のある待機演出 |
| **ホバーインタラクション** | 微細なアニメーション |
| **ストーリーテリング** | スクロールで物語を展開 |

---

## 2. アニメーション & インタラクション

### 2.1 スクロールドリブンアニメーション

**CSS Scroll-Driven Animations (Chrome 145+)**
```css
@keyframes reveal {
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-on-scroll {
  animation: reveal linear;
  animation-timeline: view();
  animation-range: entry 0% entry 50%;
}
```

**JavaScript実装（互換性重視）**
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animated');
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.animate-on-scroll').forEach(el => {
  observer.observe(el);
});
```

### 2.2 マイクロインタラクション

| 種類 | 目的 | 実装 |
|------|------|------|
| **ボタンホバー** | フィードバック | 色変化、スケール、リップル効果 |
| **フォームフィールド** | 入力認識 | ボーダー色変化、ラベルアニメーション |
| **チェックボックス** | 確認感 | チェックマークのSVGアニメーション |
| **送信成功** | 完了通知 | 緑色フェード、チェックアイコン |
| **スクロールインジケーター** | 誘導 | 矢印のバウンス |

### 2.3 パララックス効果

```javascript
function initParallax() {
  const parallaxBg = document.querySelector('.parallax-bg');

  window.addEventListener('scroll', () => {
    const rect = parallaxBg.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const yPos = (rect.top / window.innerHeight) * 50;
      parallaxBg.style.transform = `translateY(${yPos}px)`;
    }
  }, { passive: true });
}
```

### 2.4 カウントアップアニメーション

```javascript
function animateCounter(element, target, duration = 2000) {
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    element.textContent = Math.floor(easeOutQuart * target).toLocaleString();

    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}
```

---

## 3. パーティクル & エフェクト

### 3.1 桜エフェクト（日本向け）

```javascript
function createSakuraPetal(container, colors) {
  const petal = document.createElement('div');
  petal.className = 'sakura-petal';

  const size = 8 + Math.random() * 8;
  const left = Math.random() * 100;
  const duration = 8 + Math.random() * 12;
  const delay = Math.random() * 5;
  const color = colors[Math.floor(Math.random() * colors.length)];

  petal.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    left: ${left}%;
    background: ${color};
    animation: sakuraFall ${duration}s linear ${delay}s infinite;
  `;

  container.appendChild(petal);
}
```

### 3.2 浮遊パーティクル（汎用）

```css
@keyframes float {
  0%, 100% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
  10% { opacity: 0.7; }
  90% { opacity: 0.7; }
  100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
}

.particle {
  position: absolute;
  border-radius: 50%;
  animation: float linear infinite;
  pointer-events: none;
}
```

### 3.3 マウストレイル

```javascript
document.addEventListener('mousemove', (e) => {
  const trail = document.createElement('div');
  trail.className = 'mouse-trail';
  trail.style.left = `${e.clientX - 10}px`;
  trail.style.top = `${e.clientY - 10}px`;
  document.body.appendChild(trail);

  setTimeout(() => {
    trail.style.transform = 'scale(2)';
    trail.style.opacity = '0';
  }, 10);

  setTimeout(() => trail.remove(), 500);
});
```

---

## 4. レイアウトパターン

### 4.1 Bento Grid

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 200px);
  gap: 1rem;
}

.bento-item--large {
  grid-column: span 2;
  grid-row: span 2;
}

.bento-item--wide {
  grid-column: span 2;
}

.bento-item--tall {
  grid-row: span 2;
}
```

### 4.2 フルスクリーンヒーロー

```css
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.hero__bg {
  position: absolute;
  inset: 0;
}

.hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0,0,0,0.3) 0%,
    rgba(0,0,0,0.6) 100%
  );
}
```

### 4.3 スプリットレイアウト

```css
.split-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}

@media (max-width: 768px) {
  .split-section {
    grid-template-columns: 1fr;
  }
}
```

---

## 5. フォーム & CTA

### 5.1 高級感のあるフォーム

```css
.form-group input {
  width: 100%;
  padding: 1rem;
  border: 1px solid rgba(201, 169, 98, 0.2);
  background: transparent;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-group label {
  display: block;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  color: var(--color-text-light);
}
```

### 5.2 CTAボタン

```css
.btn--primary {
  position: relative;
  padding: 1rem 2.5rem;
  background: var(--color-primary);
  color: white;
  border: 1px solid var(--color-primary);
  overflow: hidden;
  transition: all 0.4s ease;
}

.btn--primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--color-secondary);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.4s ease;
}

.btn--primary:hover::before {
  transform: scaleX(1);
  transform-origin: left;
}

.btn--primary span {
  position: relative;
  z-index: 1;
}
```

---

## 6. カラーパレット例

### 6.1 高級ブランド向け

| 名称 | コード | 用途 |
|------|--------|------|
| Deep Navy | `#0a0a1a` | 背景 |
| Champagne Gold | `#c9a962` | アクセント |
| Soft Cream | `#faf8f5` | 明るい背景 |
| Pearl White | `#f8f8f8` | テキスト背景 |
| Charcoal | `#333333` | テキスト |

### 6.2 サイバーパンク / テック系

| 名称 | コード | 用途 |
|------|--------|------|
| Void Black | `#0d0d0d` | 背景 |
| Electric Neon | `#00ff88` | アクセント |
| Sunset Coral | `#ff6b6b` | ホットアクセント |
| Holographic | `#e0e0ff` | ハイライト |

### 6.3 和風 / 春コレクション

| 名称 | コード | 用途 |
|------|--------|------|
| Deep Indigo | `#1a1a2e` | 背景 |
| Sakura Pink | `#ffd6e0` | アクセント |
| Gold Leaf | `#c9a962` | 高級感 |
| Soft Blossom | `#fff0f3` | 明るい背景 |

---

## 7. パフォーマンス最適化

### 7.1 Core Web Vitals目標

| 指標 | 目標値 | 対策 |
|------|--------|------|
| LCP | < 2.5秒 | 画像最適化、遅延読み込み |
| INP | < 200ms | JavaScript最適化、イベントデバウンス |
| CLS | < 0.1 | 画像サイズ明示、フォントプリロード |

### 7.2 アニメーションのベストプラクティス

```css
/* GPUアクセラレーション */
.animated-element {
  will-change: transform, opacity;
  transform: translateZ(0);
}

/* reduceMotion対応 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 7.3 画像最適化

- WebP/AVIF形式を優先
- srcsetでレスポンシブ画像
- loading="lazy"で遅延読み込み
- 適切なサイズ指定でCLS防止

---

## 8. LP-Editor互換性チェックリスト

LP作成時に必ず確認：

- [ ] **画像フィールド**: `<img src="...">` タグを使用（SVGインラインはNG）
- [ ] **CSPメタタグ**: HTMLに含めない（LP-Editorでブロックされる）
- [ ] **href="#"リンク**: JSで`e.preventDefault()`を追加
- [ ] **外部フォント**: システムフォントへのフォールバック設定
- [ ] **data-type属性**: すべての編集可能要素に設定
- [ ] **リピートブロック**: `data-repeat`と`data-repeat-item`を正しく設定

---

## 9. 推奨ライブラリ

| ライブラリ | 用途 | 特徴 |
|-----------|------|------|
| GSAP | 高度なアニメーション | スクロールトリガー、タイムライン |
| Framer Motion | React向け | 物理ベースアニメーション |
| Lottie | ベクターアニメーション | After Effectsエクスポート |
| Anime.js | 軽量アニメーション | シンプルAPI |
| Motion One | モダンAPI | Web Animations API準拠 |

---

## 10. 参考リソース

- [Figma Web Design Trends](https://www.figma.com/resource-library/web-design-trends/)
- [UX Design Trends 2026](https://uxdesign.cc/10-ux-design-shifts-you-cant-ignore-in-2026-8f0da1c6741d)
- [Luxury Website Design Examples](https://www.designrush.com/best-designs/websites/trends/best-luxury-website-designs)
- [CSS Scroll-Driven Animations](https://developer.chrome.com/blog/scroll-triggered-animations)
- [Motion UI Trends 2026](https://lomatechnology.com/blog/motion-ui-trends-2026/2911)
- [eCommerce Design Trends](https://gempages.net/blogs/shopify/ecommerce-design-trends)

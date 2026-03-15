# Netflix映画『超かぐや姫！』公式サイト - サイト分析リファレンス

> 分析日時: 2026-02-05T02:14:57.265Z
> 元URL: https://www.cho-kaguyahime.com/

## 概要

| 項目 | 数 |
|------|----|
| セクション | 30 |
| CSSアニメーション | 22 |
| スライダー | 5 |
| モーダル | 30 |
| マスク効果 | 2 |
| グラデーション | 4 |

## ページ構成

| ID | クラス | 高さ | アニメーション |
|----|--------|------|---------------|
| top | is-fv | 11216px | ✓ |
| fullWrap |  | 11216px | ✓ |
| js-gnavMenuLabel | gnav__menuLabel | 0px | ✓ |
| js-gnav | gnav__lists | 0px | ✓ |
| js-gsns | gnav__officialLists | 0px | ✓ |
| js-gnavCharacter | gnav__character | 0px | ✓ |
| js-hotnews | gnav__hotTopicsItem | 0px | ✓ |
| kv | kv | 1080px | ✓ |
| js-kvSwiper | kv__imgContentin swiper | 1080px | ✓ |
| swiper-wrapper-20a770977510e6b102 | kv__imgs swiper-wrapper | 1080px | ✓ |
| fv | fv sections | 1080px | ✓ |
| nav | nav | 165px | ✓ |
| js-nav | nav__lists | 164px | ✓ |
| js-sns | fv__snsLists | 250px | ✓ |
| js-kvSwiperSwitchers | fv__kvSwitcherLists | 120px | ✓ |
| js-bnr | fv__bnr | 120px | ✓ |
| js-bnrSwiper | fv__bnrSwiper swiper | 120px | ✓ |
| js-bnrSwiperWrapper | fv__bnrSwiper-wrapper swiper-wrapper | 64px | ✓ |
| news | news sections | 701px | ✓ |
| js-newsLists | news__lists | 266px | ✓ |

## ナビゲーション

- タイプ: fixed
- ハンバーガーメニュー: あり
- スムーススクロール: あり

## アニメーション一覧

### `mirrorball`
```css
@keyframes mirrorball {
  0% { background-position: 0px 0px; }
  100% { background-position: 100% 0px; }
}
```

### `scrollLine`
```css
@keyframes scrollLine {
  0% { height: 0px; bottom: 0px; }
  20%, 40% { height: 100%; bottom: 0px; }
  60%, 100% { height: 0px; bottom: 100%; }
}
```

### `c0`
```css
@keyframes c0 {
  0% { background-position: 0px 0px; }
  100% { background-position: max(calc(-511 / var(--vw-min) * 100vw),-511px) 0; }
}
```

### `c1`
```css
@keyframes c1 {
  0% { background-position: 0px 0px; }
  100% { background-position: max(calc(-988 / var(--vw-min) * 100vw),-988px) 0; }
}
```

### `c2`
```css
@keyframes c2 {
  0% { background-position: 0px 0px; }
  100% { background-position: max(calc(-994 / var(--vw-min) * 100vw),-994px) 0; }
}
```

### `c3`
```css
@keyframes c3 {
  0% { background-position: 0px 0px; }
  100% { background-position: max(calc(-556 / var(--vw-min) * 100vw),-556px) 0; }
}
```

### `c2s`
```css
@keyframes c2s {
  0% { mask-size: 100% 100%,
		var(--kv-circle-width)
		var(--kv-circle-width); mask-image: linear-gradie... }
  50% { mask-size: 100% 100%,
		0
		calc(var(--kv-circle-width) * 0.5625); mask-image: linear-gradient(rgb... }
  100% { mask-size: 100% 100%,
		var(--kv-circle-width)
		calc(var(--kv-circle-width) * 0.5625); mask-image... }
}
```

### `s2c`
```css
@keyframes s2c {
  100% { mask-size: 100% 100%,
		var(--kv-circle-width)
		var(--kv-circle-width); mask-image: linear-gradie... }
  50% { mask-size: 100% 100%,
		0
		calc(var(--kv-circle-width) * 0.5625); mask-image: linear-gradient(rgb... }
  0% { mask-size: 100% 100%,
		var(--kv-circle-width)
		calc(var(--kv-circle-width) * 0.5625); mask-image... }
}
```

### `floating-y`
```css
@keyframes floating-y {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(min(calc(15 / var(--vw-min) * 100vw),15px)); }
}
```

### `floating-x`
```css
@keyframes floating-x {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateX(min(calc(15 / var(--vw-min) * 100vw),15px)); }
}
```

### `spotlightL`
```css
@keyframes spotlightL {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(-5deg); }
  100% { transform: rotate(0deg); }
}
```

### `spotlightR`
```css
@keyframes spotlightR {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(5deg); }
  100% { transform: rotate(0deg); }
}
```

### `fog`
```css
@keyframes fog {
  0% { background-position: 0px 0px; }
  100% { background-position: min(calc(2360 / var(--vw-min) * 100vw),2360px) 0; }
}
```

### `datedeco`
```css
@keyframes datedeco {
  0% { background-position: 0px 0px; }
  100% { background-position: min(calc(12 / var(--vw-min) * 100vw),12px) 0; }
}
```

### `swiperNavCircle`
```css
@keyframes swiperNavCircle {
  0% { stroke-dasharray: 0, 72; }
  100% { stroke-dasharray: 72, 72; }
}
```

### `coinrotate`
```css
@keyframes coinrotate {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(720deg); }
}
```

### `commentL`
```css
@keyframes commentL {
  0% { opacity: 0; transform: translateX(100%); }
  8% { opacity: 1; transform: translateX(5%); }
  50% { opacity: 1; transform: translateX(-5%); }
}
```

### `commentR`
```css
@keyframes commentR {
  0% { opacity: 0; transform: translateX(-100%); }
  8% { opacity: 1; transform: translateX(-5%); }
  50% { opacity: 1; transform: translateX(5%); }
}
```

### `umbrella`
```css
@keyframes umbrella {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(720deg); }
}
```

### `pancake-flash`
```css
@keyframes pancake-flash {
  0% { transform: rotate(0deg); }
  50%, 100% { transform: rotate(180deg); }
}
```

## スライダー

### kv__imgContentin
- ライブラリ: swiper
- エフェクト: fade
- スライド数: 5
- 自動再生: なし
- ナビゲーション: なし

### fv__bnrSwiper
- ライブラリ: swiper
- エフェクト: slide
- スライド数: 1
- 自動再生: なし
- ナビゲーション: なし

### movie__swiper
- ライブラリ: swiper
- エフェクト: coverflow
- スライド数: 30
- 自動再生: なし
- ナビゲーション: なし

### music__contentWrap
- ライブラリ: swiper
- エフェクト: slide
- スライド数: 30
- 自動再生: なし
- ナビゲーション: なし

### character__swiper
- ライブラリ: swiper
- エフェクト: slide
- スライド数: 14
- 自動再生: なし
- ナビゲーション: なし

## 特殊効果

### グラデーション
- `DIV.gnav__content`: linear
- `DIV.kv__fixedInner2`: linear
- `DIV.modal`: linear
- `DIV.modal`: linear

### マスク
- `DIV.kv__fixedInner`: shape (linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0)), radia...)
- `DIV.kv__fixedInner2`: shape (linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0)), radia...)

### フィルター
- `SPAN.gnav__menuBtnBox`: backdrop: blur(4px)

## 使用技術

### ライブラリ
- jQuery 3.6.0
- Swiper

## カラーパレット

```css
:root {
  --color-1: rgb(0, 0, 0);
  --color-2: rgb(40, 40, 40);
  --color-3: rgb(255, 255, 255);
  --color-4: rgb(34, 34, 34);
  --color-5: rgb(0, 192, 195);
  --color-6: rgb(255, 99, 93);
  --color-7: rgb(255, 228, 143);
  --color-8: rgb(104, 204, 220);
  --color-9: rgb(162, 134, 231);
  --color-10: rgb(255, 135, 124);
}
```

## タイポグラフィ

フォント: "Times New Roman", vdl-logog

| 要素 | サイズ | 行間 | 字間 |
|------|--------|------|------|
| P | 16px | 32px | 0.8px |
| H1 | 16px | 32px | 0.8px |
| H2 | 16px | 32px | 0.8px |
| H3 | 16px | 32px | 0.8px |
| H4 | 12px | 24px | 0.8px |

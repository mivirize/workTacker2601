# LP Design Pattern Library

> Updated: 2026-02-05T02:14:57.407Z
> Total patterns: 29
> Sites analyzed: 1

## Animations (22)

### mirrorball
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes mirrorball {
  0% { background-position: 0px 0px; }
  100% { background-position: 100% 0px; }
}
```

Usage: animation: mirrorball 1s ease infinite;

---

### scrollLine
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes scrollLine {
  0% { height: 0px; bottom: 0px; }
  20%, 40% { height: 100%; bottom: 0px; }
  60%, 100% { height: 0px; bottom: 100%; }
}
```

Usage: animation: scrollLine 1s ease infinite;

---

### c0
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes c0 {
  0% { background-position: 0px 0px; }
  100% { background-position: max(calc(-511 / var(--vw-min) * 100vw),-511px) 0; }
}
```

Usage: animation: c0 1s ease infinite;

---

### c1
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes c1 {
  0% { background-position: 0px 0px; }
  100% { background-position: max(calc(-988 / var(--vw-min) * 100vw),-988px) 0; }
}
```

Usage: animation: c1 1s ease infinite;

---

### c2
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes c2 {
  0% { background-position: 0px 0px; }
  100% { background-position: max(calc(-994 / var(--vw-min) * 100vw),-994px) 0; }
}
```

Usage: animation: c2 1s ease infinite;

---

### c3
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes c3 {
  0% { background-position: 0px 0px; }
  100% { background-position: max(calc(-556 / var(--vw-min) * 100vw),-556px) 0; }
}
```

Usage: animation: c3 1s ease infinite;

---

### c2s
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes c2s {
  0% { mask-size: 100% 100%,
		var(--kv-circle-width)
		var(--kv-circle-width); mask-image: linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0)), radial-gradient(rgb(0, 0, 0) 0%, rgb(0, 0, 0) 70.5%, rgba(0, 0, 0, 0 }
  50% { mask-size: 100% 100%,
		0
		calc(var(--kv-circle-width) * 0.5625); mask-image: linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0)), linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0)); }
  100% { mask-size: 100% 100%,
		var(--kv-circle-width)
		calc(var(--kv-circle-width) * 0.5625); mask-image: linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0)), linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0)); }
}
```

Usage: animation: c2s 1s ease infinite;

---

### s2c
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes s2c {
  100% { mask-size: 100% 100%,
		var(--kv-circle-width)
		var(--kv-circle-width); mask-image: linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0)), radial-gradient(rgb(0, 0, 0) 0%, rgb(0, 0, 0) 70.5%, rgba(0, 0, 0, 0 }
  50% { mask-size: 100% 100%,
		0
		calc(var(--kv-circle-width) * 0.5625); mask-image: linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0)), linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0)); }
  0% { mask-size: 100% 100%,
		var(--kv-circle-width)
		calc(var(--kv-circle-width) * 0.5625); mask-image: linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0)), linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0)); }
}
```

Usage: animation: s2c 1s ease infinite;

---

### floating-y
Source: https://www.cho-kaguyahime.com/
Tags: animation, float

```css
@keyframes floating-y {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(min(calc(15 / var(--vw-min) * 100vw),15px)); }
}
```

Usage: animation: floating-y 1s ease infinite;

---

### floating-x
Source: https://www.cho-kaguyahime.com/
Tags: animation, float

```css
@keyframes floating-x {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateX(min(calc(15 / var(--vw-min) * 100vw),15px)); }
}
```

Usage: animation: floating-x 1s ease infinite;

---

### spotlightL
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes spotlightL {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(-5deg); }
  100% { transform: rotate(0deg); }
}
```

Usage: animation: spotlightL 1s ease infinite;

---

### spotlightR
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes spotlightR {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(5deg); }
  100% { transform: rotate(0deg); }
}
```

Usage: animation: spotlightR 1s ease infinite;

---

### fog
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes fog {
  0% { background-position: 0px 0px; }
  100% { background-position: min(calc(2360 / var(--vw-min) * 100vw),2360px) 0; }
}
```

Usage: animation: fog 1s ease infinite;

---

### datedeco
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes datedeco {
  0% { background-position: 0px 0px; }
  100% { background-position: min(calc(12 / var(--vw-min) * 100vw),12px) 0; }
}
```

Usage: animation: datedeco 1s ease infinite;

---

### swiperNavCircle
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes swiperNavCircle {
  0% { stroke-dasharray: 0, 72; }
  100% { stroke-dasharray: 72, 72; }
}
```

Usage: animation: swiperNavCircle 1s ease infinite;

---

### coinrotate
Source: https://www.cho-kaguyahime.com/
Tags: animation, rotate

```css
@keyframes coinrotate {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(720deg); }
}
```

Usage: animation: coinrotate 1s ease infinite;

---

### commentL
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes commentL {
  0% { opacity: 0; transform: translateX(100%); }
  8% { opacity: 1; transform: translateX(5%); }
  50% { opacity: 1; transform: translateX(-5%); }
  58%, 100% { opacity: 0; transform: translateX(-100%); }
}
```

Usage: animation: commentL 1s ease infinite;

---

### commentR
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes commentR {
  0% { opacity: 0; transform: translateX(-100%); }
  8% { opacity: 1; transform: translateX(-5%); }
  50% { opacity: 1; transform: translateX(5%); }
  58%, 100% { opacity: 0; transform: translateX(100%); }
}
```

Usage: animation: commentR 1s ease infinite;

---

### umbrella
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes umbrella {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(720deg); }
}
```

Usage: animation: umbrella 1s ease infinite;

---

### pancake-flash
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes pancake-flash {
  0% { transform: rotate(0deg); }
  50%, 100% { transform: rotate(180deg); }
}
```

Usage: animation: pancake-flash 1s ease infinite;

---

### lantern1
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes lantern1 {
  0%, 30%, 100% { opacity: 0; }
  50%, 80% { opacity: 1; }
}
```

Usage: animation: lantern1 1s ease infinite;

---

### lantern2
Source: https://www.cho-kaguyahime.com/
Tags: animation

```css
@keyframes lantern2 {
  0%, 30%, 100% { opacity: 1; }
  50%, 80% { opacity: 0; }
}
```

Usage: animation: lantern2 1s ease infinite;

---

## Components (3)

### swiper fade slider
Source: https://www.cho-kaguyahime.com/
Tags: slider, swiper, fade

```css
new Swiper('.kv__imgContentin', {
  effect: 'fade',
  slidesPerView: 1,
  
  
  
});
```

Usage: 5 slides with fade effect

---

### swiper slide slider
Source: https://www.cho-kaguyahime.com/
Tags: slider, swiper, slide

```css
new Swiper('.character__swiper', {
  effect: 'slide',
  slidesPerView: 1,
  
  
  
});
```

Usage: 14 slides with slide effect

---

### swiper coverflow slider
Source: https://www.cho-kaguyahime.com/
Tags: slider, swiper, coverflow

```css
new Swiper('.movie__swiper', {
  effect: 'coverflow',
  slidesPerView: 1,
  
  
  
});
```

Usage: 30 slides with coverflow effect

---

## Effects (2)

### linear gradient
Source: https://www.cho-kaguyahime.com/
Tags: gradient, linear

```css
background: url("https://www.cho-kaguyahime.com/assets/img/common/bg_light.png"), linear-gradient(rgb(203, 196, 248) 0%, rgb(245, 186, 191) 100%);
```

Usage: Apply to any element for gradient background

---

### shape mask
Source: https://www.cho-kaguyahime.com/
Tags: mask, shape

```css
-webkit-mask: linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0)), radial-gradient(rgb(0, 0, 0) 0%, rgb(0, 0, 0) 70.5%, rg;
mask: linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0)), radial-gradient(rgb(0, 0, 0) 0%, rgb(0, 0, 0) 70.5%, rg;
```

Usage: Apply mask to create shaped elements

---

## Colors (1)

### Color palette from www.cho-kaguyahime.com
Source: https://www.cho-kaguyahime.com/
Tags: color, palette

```css
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
```

Usage: CSS custom properties for color scheme

---

## Typographys (1)

### Typography from www.cho-kaguyahime.com
Source: https://www.cho-kaguyahime.com/
Tags: typography, "Times New Roman", vdl-logog

```css
p {
  font-size: 16px;
  line-height: 32px;
  letter-spacing: 0.8px;
}

h1 {
  font-size: 16px;
  line-height: 32px;
  letter-spacing: 0.8px;
}

h2 {
  font-size: 16px;
  line-height: 32px;
  letter-spacing: 0.8px;
}

h3 {
  font-size: 16px;
  line-height: 32px;
  letter-spacing: 0.8px;
}

h4 {
  font-size: 12px;
  line-height: 24px;
  letter-spacing: 0.8px;
}
```

Usage: Typography styles for headings and text

---

## Analyzed Sites

### Netflix映画『超かぐや姫！』公式サイト
- URL: https://www.cho-kaguyahime.com/
- Analyzed: 2026-02-05T02:14:57.265Z
- Highlights: 22 animations, 5 sliders, 2 masks
- Tags: jQuery 3.6.0, Swiper


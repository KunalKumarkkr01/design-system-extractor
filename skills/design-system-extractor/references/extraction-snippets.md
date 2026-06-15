# Extraction snippets

Ready-to-adapt functions to pass to the Chrome DevTools MCP `evaluate_script` tool.
Each is a standalone arrow function returning JSON-serializable data — paste, tweak the
selectors for the target site, and read the result. They are ordered roughly in the
order you'll use them.

## Table of contents
1. Dump `:root` CSS custom properties (design tokens)
2. Sample computed styles per text/UI role
3. Convert `lab()` / `oklch()` colors to hex
4. Collect the real palette (every distinct color in use)
5. Layout & spacing metrics
6. Scroll helper for sectioned screenshots

---

## 1. Dump `:root` CSS custom properties

Token-based systems (Vercel `--ds-*`, Radix, Tailwind v4, MUI, shadcn) define their
whole palette and scale here. This is the single highest-value read.

```js
() => {
  const vars = {};
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch (e) { continue; } // cross-origin sheets throw
    if (!rules) continue;
    for (const rule of rules) {
      if (rule.selectorText && rule.selectorText.split(',').some(s => s.trim().endsWith(':root'))) {
        for (const prop of rule.style) {
          if (prop.startsWith('--')) vars[prop] = rule.style.getPropertyValue(prop).trim();
        }
      }
    }
  }
  return vars;
}
```

If you get little back, the theme may be applied on a class/attribute selector
(`.dark`, `[data-theme="dark"]`) instead of `:root` — widen the match accordingly, or
just rely on snippet #2's resolved values.

---

## 2. Sample computed styles per role

Resolve what each role actually renders. Add selectors that match the target site.

```js
() => {
  const sample = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = getComputedStyle(el);
    return {
      fontFamily: s.fontFamily, fontSize: s.fontSize, fontWeight: s.fontWeight,
      lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, textTransform: s.textTransform,
      color: s.color, background: s.backgroundColor,
      border: s.border, borderColor: s.borderTopColor, borderRadius: s.borderRadius,
      padding: s.padding, margin: s.margin, boxShadow: s.boxShadow,
    };
  };
  const cs = getComputedStyle(document.body);
  return {
    body: { bg: cs.backgroundColor, color: cs.color, font: cs.fontFamily, size: cs.fontSize, lh: cs.lineHeight },
    h1: sample('h1'), h2: sample('h2'), h3: sample('h3'),
    p: sample('p'), a: sample('a'),
    button: sample('button'), input: sample('input'),
    nav: sample('header a, nav a'),
    card: sample('[class*="card"]'),
    code: sample('code, pre'),
  };
}
```

---

## 3. Convert `lab()` / `oklch()` to hex

Modern Chrome reports computed colors in `lab(...)` and canvas may not convert them.
This resolves any CSS color string to `#rrggbb` by painting one pixel and reading it
back, which forces the engine to give you sRGB bytes.

```js
() => {
  const toHex = (color) => {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillStyle = color;          // accepts lab(), oklch(), rgb(), named, etc.
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  };
  // example: resolve a set of role colors
  const grab = (sel, prop = 'color') => {
    const el = document.querySelector(sel);
    return el ? toHex(getComputedStyle(el)[prop]) : null;
  };
  return {
    bg: toHex(getComputedStyle(document.body).backgroundColor),
    text: toHex(getComputedStyle(document.body).color),
    link: grab('a', 'color'),
    border: grab('*', 'borderTopColor'),
  };
}
```

`getImageData` is the reliable path. If you ever see the `lab(...)` string come back
unchanged from `ctx.fillStyle`, it's because Chrome kept the wide-gamut representation —
reading the painted pixel (as above) avoids that.

---

## 4. Collect the real palette

Walk the rendered tree and tally every distinct text/background/border color actually in
use, most-frequent first. Surfaces the true working palette (often a tight set of grays
plus one accent).

```js
() => {
  const toHex = (color) => {
    const c = document.createElement('canvas'); c.width = c.height = 1;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#000'; ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1); const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return a === 0 ? null : '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  };
  const counts = {};
  const bump = (hex) => { if (hex) counts[hex] = (counts[hex] || 0) + 1; };
  document.querySelectorAll('body *').forEach(el => {
    const s = getComputedStyle(el);
    bump(toHex(s.color)); bump(toHex(s.backgroundColor)); bump(toHex(s.borderTopColor));
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 25);
}
```

---

## 5. Layout & spacing metrics

```js
() => {
  const m = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    return {
      display: s.display, gridTemplateColumns: s.gridTemplateColumns,
      gap: s.gap, maxWidth: s.maxWidth, padding: s.padding, margin: s.margin,
      borderRadius: s.borderRadius, borderTop: s.borderTopWidth + ' ' + s.borderTopColor,
      width: Math.round(el.getBoundingClientRect().width) + 'px',
      position: s.position, height: s.height,
    };
  };
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    pageHeight: document.documentElement.scrollHeight,
    body: m(document.body),
    main: m(document.querySelector('main')),
    header: m(document.querySelector('header')),
    firstGrid: m([...document.querySelectorAll('*')].find(e => getComputedStyle(e).display === 'grid')),
    radiiInUse: [...new Set([...document.querySelectorAll('body *')]
      .map(e => getComputedStyle(e).borderRadius).filter(r => r && r !== '0px'))].slice(0, 12),
  };
}
```

`radiiInUse` answers "is this a sharp or rounded design?" at a glance, and flags any
intentional exceptions.

---

## 6. Scroll helper for sectioned screenshots

Avoid giant `fullPage` images on long pages: scroll to a section, then take a viewport
screenshot.

```js
// scroll to an element by text and park it near the top
(needle) => {
  const el = [...document.querySelectorAll('h1,h2,h3,section,header,footer')]
    .find(e => e.textContent.toLowerCase().includes(needle.toLowerCase()));
  if (!el) return { found: false, scrollY: window.scrollY };
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 24);
  return { found: true, scrollY: window.scrollY };
}
```

Pass the search text as an argument (the `args` option of `evaluate_script`), or inline
a `window.scrollTo(0, <px>)` from a y-offset you already measured.

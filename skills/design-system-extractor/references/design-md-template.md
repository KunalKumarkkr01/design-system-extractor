# `design.md` template

Use this as the skeleton for the deliverable. Keep the section order; drop sections that
genuinely don't apply. The audience is an implementer (human or LLM) who will **never
see the original site** — every claim must be concrete enough to act on. Replace
bracketed prompts with real values; keep screenshot links relative.

---

````markdown
# <Site> — Design System Reference

> Reverse-engineered from <URL> (captured <date> via Chrome DevTools).
> Purpose: a single source of truth to rebuild this site's look & feel.
> Stack detected: <framework / token system / fonts, or "unknown">.

Screenshots are in `./screenshots/`.

## 1. Aesthetic Direction
<2–3 sentences: what this design *is* (e.g. "dark, monochrome, terminal-flavored").>
**The memorable thing:** <the one element someone remembers>.
**Do NOT:** <guardrails — e.g. "add rounded corners, drop shadows, or accent colors;
the chrome is strictly grayscale and sharp-cornered">. Guardrails matter because an
implementer left to defaults will drift toward generic AI styling.

![Hero](screenshots/01-hero.png)

## 2. Color Tokens
### Resolved theme (what the UI actually uses)
| Role | Hex | Notes |
|------|-----|-------|
| Background | `#000000` | |
| Foreground / text | `#ededed` | |
| Muted text | `#a1a1a1` | |
| Border / divider | `#1f1f1f` | |
| Accent | `#28a948` | used only for <where> |

### Token scales (if the site uses `--vars`)
List the named scales you found (gray 100–1000, accent ramps, etc.) with hex, so the
implementer can reproduce the system, not just the surface.

## 3. Typography
| Role | Family | Size / line-height | Weight | Transform / tracking | Used for |
|------|--------|--------------------|--------|----------------------|----------|
| h1 | <font> | 36 / 40 | 600 | none | page titles |
| Body | <font> | 16 / 24 | 400 | none | prose |
| Label | <mono> | 14 / 20 | 500 | uppercase | section headers |
**Rule of thumb:** <which family maps to which role, e.g. "mono for all labels/data,
sans for prose">.

## 4. Layout & Spacing
- Content max-width: <px>, centered.
- Header: <height>, `position: <static/sticky>`.
- Corners: <`border-radius: 0` everywhere / rounded Npx / pills>.
- Dividers/borders: <width + color>.
- Grid: <columns + gap>. Vertical rhythm: <section spacing>.

## 5. Components
One subsection per distinct component, each with a screenshot and concrete specs.
### 5.1 Nav / Header
<layout, items, type, states> ![Nav](screenshots/02-nav.png)
### 5.2 <Card / Table / Form / Footer ...>
<...>

## 6. Interaction & Motion
- Hover: <what changes — e.g. "subtle bg wash, no transform">.
- Focus: <ring/outline spec>.
- Transitions: <durations/easing observed>.

## 7. Responsive Behavior
| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768) | <what stacks, what hides> |
| Desktop (≥1024) | <columns, max-width> |
![Mobile](screenshots/0X-mobile.png)

## 8. Implementation Notes
- Framework / CSS approach: <detected stack>.
- Fonts to load: <families + source>.
- Icons: <library if identifiable>.
- Globals: <baseline radius, body bg, container>.
- Any intentional inconsistencies to preserve: <...>.

## 9. Screenshot Index
| File | Shows |
|------|-------|
| `screenshots/01-hero.png` | <...> |

### Drop-in token block
```css
:root {
  --bg: #000000;
  --fg: #ededed;
  --muted: #a1a1a1;
  --border: #1f1f1f;
  --accent: #28a948;
  --font-sans: "<Sans>", system-ui, sans-serif;
  --font-mono: "<Mono>", ui-monospace, monospace;
}
```
````

---

## Quality bar

A finished `design.md` should let a reader who has **never seen the site** rebuild a
faithful approximation. Concretely:

- Every color and size is a **resolved value** (`#1f1f1f`, `14px`), never "a dark gray".
- Each component section has a **screenshot** whose path resolves.
- The aesthetic direction and **do-NOTs** are stated up front.
- A **drop-in token block** lets implementation start in one paste.
- Distinctive traits and intentional exceptions are called out, not averaged away.

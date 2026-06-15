---
name: design-system-extractor
description: >-
  Reverse-engineer the design system of any live website into a single,
  implementation-ready reference (a design.md plus annotated screenshots) that
  another LLM or developer can follow to faithfully recreate the look and feel.
  Use this whenever the user wants to capture, document, extract, clone, mirror,
  copy, or reproduce the design / UI / styling / "vibe" / look-and-feel of an
  existing site or web app — for example "document the design system of
  stripe.com", "make a style guide from this URL", "I want my app to look like
  X, extract their design tokens", or "explore this site and tell me how it's
  built visually". Works on any reachable URL. Requires the Chrome DevTools MCP
  server to drive a real browser; the skill is non-functional without it.
---

# Design System Extractor

Turn a live website into a **design reference an LLM can build from**: a structured
`design.md` documenting colors, typography, spacing, components, and interactions —
backed by **real screenshots** captured from an actual browser. The goal is not a
pretty write-up for humans; it is a precise spec another agent can implement against
without ever seeing the original site.

The reason this works is that a running page already contains the ground truth. Rather
than guessing styles from a screenshot, you read **computed styles** and **CSS custom
properties** straight out of the DOM, so the tokens you record are exactly what the site
ships. Screenshots then anchor the prose so an implementer can see what each token
produces.

---

## Prerequisite: Chrome DevTools for agents (hard dependency)

This skill drives a real Chrome instance through **Chrome DevTools for agents** — the
official Chrome offering that ships *both* an MCP server and agent skills
(`chrome-devtools-mcp`, by the Chrome DevTools team). Without it you cannot navigate,
read computed styles, or take screenshots, and the skill cannot run.

- Docs: <https://developer.chrome.com/docs/devtools/agents>
- Source: <https://github.com/ChromeDevTools/chrome-devtools-mcp>

Confirm the tools are available before starting — you should have tools like
`navigate_page`, `take_snapshot`, `take_screenshot`, `evaluate_script`, and
`resize_page` (often namespaced, e.g. `mcp__chrome-devtools__navigate_page`).

If they are missing, install one of the following, then stop and let the user restart
their agent:

1. **Official Chrome DevTools plugin (recommended)** — gives you the MCP server *and*
   Chrome's own tool-usage skills, maintained by the Chrome team. In Claude Code:
   ```text
   /plugin marketplace add ChromeDevTools/chrome-devtools-mcp
   /plugin install chrome-devtools-mcp@chrome-devtools-plugins
   ```
   Other agents (Gemini CLI, Codex, Copilot, …): see the docs link above.

2. **This skill's plugin** — the `design-system-extractor` plugin bundles a
   `chrome-devtools` MCP server entry, so installing it wires up the MCP too. If you
   also install the official plugin above, keep only one `chrome-devtools` server to
   avoid a duplicate.

3. **Manual MCP config (any agent):**
   ```json
   {
     "mcpServers": {
       "chrome-devtools": { "command": "npx", "args": ["-y", "chrome-devtools-mcp@latest", "--isolated"] }
     }
   }
   ```

### Browser requirement

`chrome-devtools-mcp` needs **Node.js LTS** and a **Chrome (current stable or newer)**.
It uses your system Chrome by default and does **not** silently download one. If no
Chrome is present, either install Chrome normally, or install a Chrome for Testing build
and point the server at it:

```bash
npx puppeteer browsers install chrome   # installs a Chrome for Testing binary
# then pass --executablePath <path> (or --channel stable) to chrome-devtools-mcp
```

Useful flags: `--isolated` (temporary, auto-cleaned profile — ideal for clean
extraction), `--channel <stable|beta|dev|canary>`, `--headless`,
`--executablePath <path>`, `--browser-url <url>` (attach to a running Chrome).

Do not fake the workflow with `WebFetch` or a static HTML grab — those miss computed
styles, web fonts, JS-rendered content, and responsive behavior, which are the whole
point.

---

## What you produce

A self-contained folder (default `./<site>-design-reference/`):

```
<site>-design-reference/
├── design.md            # the reference spec (see structure below)
└── screenshots/
    ├── 01-hero-...png   # numbered, named by what they show
    └── ...
```

`design.md` is the deliverable. Screenshots are referenced from it with relative paths
so the whole folder travels together.

---

## Workflow

Work through these steps in order. Steps 3–6 are the substance; do not shortcut them by
eyeballing a screenshot.

### 1. Scope and set up

Confirm the target URL and what the user cares about (whole site vs. one page; specific
breakpoints). Then:

- Create the output folder and a `screenshots/` subfolder.
- `navigate_page` to the URL.
- `resize_page` to a canonical **desktop** size (1440×900 is a good default) so
  measurements are reproducible.

### 2. Map the page

Call `take_snapshot` to get the accessibility tree. This is your structural map: it
reveals sections, headings, nav, landmark roles, and link targets (so you can discover
sub-pages worth visiting). Prefer the snapshot over a screenshot for *structure* —
it is text, it is cheap, and it gives you stable `uid`s to target.

### 3. Extract design tokens (the core)

Use `evaluate_script` to read the truth out of the live DOM. Read
`references/extraction-snippets.md` and adapt the snippets there. At minimum capture:

- **Color**: `:root` CSS custom properties (design-token systems like Vercel's `--ds-*`,
  Tailwind, Radix, MUI live here), plus resolved `color` / `background-color` /
  `border-color` for body, headings, links, buttons, inputs, cards, muted text.
- **Typography**: `font-family`, `font-size`, `line-height`, `font-weight`,
  `letter-spacing`, `text-transform` for each text role (h1–h3, body, labels, code,
  buttons, nav). Note which family maps to which role.
- **Layout & spacing**: container `max-width`, section paddings, grid
  `grid-template-columns` / `gap`, `border-radius` (is it sharp or rounded?), border
  widths/colors, header height and `position`.
- **Effects**: `box-shadow`, gradients, backdrop filters, transitions.

**Gotcha — `lab()` / `oklch()` colors.** Modern Chrome returns computed colors in
`lab(...)` or `oklch(...)`, and canvas may echo them back unchanged. Convert to hex so
the reference is portable — see the conversion helper in
`references/extraction-snippets.md`. Record both the **token name** and the **resolved
hex**.

Capture data, don't just glance: dump the values to JSON via `evaluate_script` and read
them. A site's real palette is often 5–10 grays you would never match by eye.

### 4. Capture screenshots at breakpoints

Save screenshots into `screenshots/` with `filePath` and descriptive numbered names
(`01-hero.png`, `02-nav.png`, …). Cover:

- The **hero / above-the-fold** at desktop.
- Each **distinct component or section** (nav, cards, forms, tables, footer).
- At least one **mobile** capture (`resize_page` to ~390×844) to document responsive
  behavior — what stacks, what hides.

**Gotcha — full-page screenshots.** Long pages (infinite scroll, big lists) produce
enormous images. Prefer scrolling to a section (`evaluate_script` with
`window.scrollTo`) and taking viewport screenshots over a single `fullPage: true` on a
20k-pixel-tall page.

### 5. Explore states and key sub-pages

A design system lives in its variations. Capture what a single screenshot misses:

- **Interaction states**: hover, focus, active. Read them from the stylesheet/computed
  styles or trigger via the `hover` tool, and note them (e.g. "rows get a subtle bg
  wash on hover").
- **Important secondary pages** (detail/show pages, dashboards, settings) discovered in
  step 2. Document where they *break* the home page's rules — those exceptions are part
  of the system (e.g. "list is all sharp corners, but the detail page's code block is
  rounded 6px").

### 6. Write `design.md`

Follow the structure in `references/design-md-template.md`. Write for an implementer who
will never see the original. Rules that make it usable:

- Lead with the **aesthetic direction** in 2–3 sentences, plus explicit "do NOT do X"
  guardrails — these prevent an implementer from drifting back to generic defaults.
- Put tokens in **tables with resolved hex / px values**, not vague adjectives.
- Reference the screenshot for each section with a relative path
  (`![Hero](screenshots/01-hero.png)`).
- Call out **the one or two things that make the design distinctive** and any
  intentional inconsistencies.
- End with a **drop-in token block** (CSS `:root` variables / a Tailwind-style config)
  so implementation can start immediately.
- Identify the **stack** when detectable (token prefixes, font choices, framework
  fingerprints) — it tells the implementer which tools to reach for.

### 7. Verify

Before declaring done, re-read `design.md` as if you were the implementer:

- Every screenshot path resolves and shows what the text claims.
- Every color/size is a concrete value, not "a dark gray."
- A reader with zero access to the site could rebuild a faithful approximation.

Then report the output folder path and a short summary of the design's character.

---

## `design.md` structure (summary)

The full annotated template is in `references/design-md-template.md`. The spine:

1. **Overview / aesthetic direction** — what it is, the memorable thing, the don'ts.
2. **Color tokens** — resolved theme palette + any `--token` scales (with hex).
3. **Typography** — families, the scale table, role → font mapping.
4. **Layout & spacing** — container width, grid, radius, borders, rhythm.
5. **Components** — one subsection each, with a screenshot.
6. **Interaction & motion** — hover/focus/active, transitions.
7. **Responsive behavior** — what changes per breakpoint.
8. **Implementation notes** — detected stack, fonts to load, icons.
9. **Screenshot index** + a **drop-in token block**.

---

## Reference files

- `references/extraction-snippets.md` — ready-to-adapt `evaluate_script` snippets:
  CSS-variable dump, computed-style sampler, `lab()`/`oklch()` → hex conversion, layout
  metrics, and palette collection.
- `references/design-md-template.md` — the full `design.md` section template with
  examples of the level of detail expected.

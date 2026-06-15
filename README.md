# design-system-extractor

[![npm](https://img.shields.io/npm/v/design-system-extractor.svg)](https://www.npmjs.com/package/design-system-extractor)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

> Reverse-engineer the design system of **any live website** into an
> implementation-ready `design.md` + annotated screenshots that an LLM (or a developer)
> can follow to faithfully recreate the look and feel.

It works by driving a **real browser** through the Chrome DevTools MCP and reading the
**ground truth out of the running page** — computed styles, CSS custom properties,
fonts, responsive behavior — instead of guessing styles from a screenshot. The output
is a spec another agent can build from without ever seeing the original site.

This is an **agent skill**. Point your agent at a URL and ask it to extract the design
system; it explores the site and writes the reference for you.

---

## ⚠️ Requirement: Chrome DevTools MCP

This skill **cannot run without the [Chrome DevTools MCP server](https://github.com/ChromeDevTools/chrome-devtools-mcp)**
(`chrome-devtools-mcp`, by the Chrome DevTools team). That server is what lets the agent
navigate pages, read computed styles, and take screenshots from a real Chrome instance.

You need a recent **Node.js** and a local **Chrome/Chromium** install. There are two ways
to wire it up:

- **Easiest — install the Claude Code plugin below.** It *bundles* a `chrome-devtools`
  MCP server entry, so installing the plugin sets up both the skill and the browser
  driver. Just restart Claude Code afterwards.
- **Manual — add the server to your agent's MCP config:**
  ```json
  {
    "mcpServers": {
      "chrome-devtools": { "command": "npx", "args": ["-y", "chrome-devtools-mcp@latest"] }
    }
  }
  ```

If the MCP tools aren't present, the skill will tell you and stop rather than producing a
low-quality guess.

---

## Install

Pick whichever matches your setup. All three install the same skill.

### 1. Via the skills.sh ecosystem (`npx skills`)

Install straight from this GitHub repo — this is the example using the repo itself:

```bash
npx skills add https://github.com/KunalKumarkkr01/design-system-extractor --skill design-system-extractor
```

### 2. Via npm (standalone `npx` installer)

```bash
# into the current project (./.claude/skills)
npx design-system-extractor

# or globally (~/.claude/skills)
npx design-system-extractor --global

# or a custom skills directory
npx design-system-extractor --dir path/to/skills
```

### 3. As a Claude Code plugin (bundles the Chrome DevTools MCP)

```text
/plugin marketplace add KunalKumarkkr01/design-system-extractor
/plugin install design-system-extractor@design-system-extractor
```

Then restart Claude Code so the bundled `chrome-devtools` MCP server starts.

---

## Usage

Once installed (and the Chrome DevTools MCP is running), just ask:

```text
Extract the design system of https://stripe.com into a design reference.
```

```text
I want my app to look like linear.app — document their design tokens and components.
```

The skill will explore the site, capture screenshots at desktop and mobile, read the
real tokens, and write a `design.md` you can hand to any implementer.

---

## What you get

A self-contained folder you can drop into another project or feed to another agent:

```
<site>-design-reference/
├── design.md            # the reference spec
└── screenshots/
    ├── 01-hero.png
    ├── 02-nav.png
    └── ...
```

`design.md` includes:

- **Aesthetic direction** + explicit "do NOT" guardrails (keeps an implementer from
  drifting back to generic defaults)
- **Color tokens** — the resolved theme palette *and* any `--token` scales, as hex
- **Typography** — families, the full scale, and which font maps to which role
- **Layout & spacing** — container width, grid, radius, borders, rhythm
- **Components** — one section each, with a screenshot
- **Interaction & motion** — hover/focus/active, transitions
- **Responsive behavior** — what changes per breakpoint
- **Implementation notes** — detected stack, fonts, icons
- A **drop-in token block** (CSS `:root` variables) so implementation starts in one paste

---

## How it works

1. Navigate to the URL and set a canonical desktop viewport.
2. Snapshot the accessibility tree to map structure and find sub-pages.
3. Read design tokens via `evaluate_script` — `:root` custom properties and resolved
   computed styles — converting modern `lab()` / `oklch()` colors to portable hex.
4. Capture screenshots per component, plus a mobile breakpoint.
5. Explore states (hover/focus) and key secondary pages, noting intentional exceptions.
6. Write `design.md` against a strict template aimed at an implementer who never sees
   the original.

The extraction snippets and the `design.md` template live in
[`skills/design-system-extractor/references/`](./skills/design-system-extractor/references).

---

## Repository layout

```
design-system-extractor/
├── .claude-plugin/
│   ├── plugin.json          # Claude Code plugin manifest (bundles chrome-devtools MCP)
│   └── marketplace.json     # so `/plugin marketplace add` works on this repo
├── skills/
│   └── design-system-extractor/
│       ├── SKILL.md         # the skill
│       └── references/      # extraction snippets + design.md template
├── bin/cli.js               # the `npx design-system-extractor` installer
├── package.json
├── LICENSE                  # MIT
└── README.md
```

---

## License

[MIT](./LICENSE) © 2026 Kunal Kumar

## Acknowledgements

Built by Kunal Kumar with [Claude Code](https://claude.com/claude-code) (Anthropic).
Relies on the [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)
server by the Chrome DevTools team.

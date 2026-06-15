#!/usr/bin/env node
/*
 * design-system-extractor — npx installer
 *
 * Summary: Copies the `design-system-extractor` agent skill into a local skills
 * directory so an agent (Claude Code, Cursor, etc.) can discover it. This is the
 * standalone npx path; the skill is identical to the one distributed via skills.sh
 * and the Claude Code plugin.
 *
 * Usage:
 *   npx design-system-extractor            # install into ./.claude/skills
 *   npx design-system-extractor --global   # install into ~/.claude/skills
 *   npx design-system-extractor --dir <path>   # install into a custom skills dir
 *   npx design-system-extractor --help
 *
 * Note: the skill itself requires the Chrome DevTools MCP server at runtime
 * (https://github.com/ChromeDevTools/chrome-devtools-mcp). This installer only
 * places the skill files; it does not start a browser or the MCP server.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const SKILL_NAME = 'design-system-extractor';
const DEFAULT_SKILLS_SUBPATH = path.join('.claude', 'skills');
const SOURCE_DIR = path.join(__dirname, '..', 'skills', SKILL_NAME);

/**
 * Parse CLI arguments into options.
 * Input:  argv — array of raw CLI args (process.argv.slice(2)).
 * Output: { help, global, dir } where dir is an explicit target or null.
 */
function parseArgs(argv) {
  const opts = { help: false, global: false, dir: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--global' || arg === '-g') opts.global = true;
    else if (arg === '--dir' || arg === '-d') opts.dir = argv[++i] || null;
  }
  return opts;
}

/**
 * Resolve the skills directory the skill should be installed into.
 * Input:  opts — parsed options from parseArgs.
 * Output: absolute path to the skills directory (skill folder is created inside it).
 */
function resolveSkillsDir(opts) {
  if (opts.dir) return path.resolve(opts.dir);
  if (opts.global) return path.join(os.homedir(), DEFAULT_SKILLS_SUBPATH);
  return path.join(process.cwd(), DEFAULT_SKILLS_SUBPATH);
}

/**
 * Recursively copy a directory tree.
 * Input:  src, dest — absolute source and destination paths.
 * Output: none (writes files to disk).
 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

/** Print usage help. */
function printHelp() {
  process.stdout.write(
    `\ndesign-system-extractor — install the skill into an agent skills directory\n\n` +
    `Usage:\n` +
    `  npx design-system-extractor              install into ./.claude/skills\n` +
    `  npx design-system-extractor --global     install into ~/.claude/skills\n` +
    `  npx design-system-extractor --dir <path> install into a custom skills dir\n\n` +
    `After installing, ensure Chrome DevTools for agents (chrome-devtools MCP) is set up:\n` +
    `  https://developer.chrome.com/docs/devtools/agents\n\n`
  );
}

/**
 * Entry point: resolve target, copy the skill, and report next steps.
 * Context: invoked when the package is run via npx.
 */
function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) return printHelp();

  if (!fs.existsSync(SOURCE_DIR)) {
    process.stderr.write(`Error: skill source not found at ${SOURCE_DIR}\n`);
    process.exitCode = 1;
    return;
  }

  const skillsDir = resolveSkillsDir(opts);
  const target = path.join(skillsDir, SKILL_NAME);
  copyDir(SOURCE_DIR, target);

  process.stdout.write(
    `\n✓ Installed "${SKILL_NAME}" to ${target}\n\n` +
    `Next: this skill needs Chrome DevTools for agents (the chrome-devtools MCP) to run.\n` +
    `Docs: https://developer.chrome.com/docs/devtools/agents\n` +
    `  • Official plugin (recommended, MCP + Chrome's skills) in Claude Code:\n` +
    `      /plugin marketplace add ChromeDevTools/chrome-devtools-mcp\n` +
    `      /plugin install chrome-devtools-mcp@chrome-devtools-plugins\n` +
    `  • Or install the design-system-extractor plugin (bundles the MCP), or\n` +
    `  • add it manually to your agent's MCP config:\n` +
    `      "chrome-devtools": { "command": "npx", "args": ["-y", "chrome-devtools-mcp@latest", "--isolated"] }\n\n` +
    `Requires Node.js LTS and a Chrome (stable+). Then ask your agent:\n` +
    `  "extract the design system of <url>".\n\n`
  );
}

main();

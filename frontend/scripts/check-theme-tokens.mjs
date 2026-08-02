import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL("..", import.meta.url));
const sourceDirectory = join(frontendRoot, "src");
const globalsPath = join(sourceDirectory, "styles", "globals.css");

const requiredTokens = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--border",
  "--input",
  "--ring",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
  "--brand-red",
];

const tailwindBuiltInTokens = new Set(["--radius-full"]);

async function collectCssFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      paths.push(...(await collectCssFiles(path)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".css")) {
      paths.push(path);
    }
  }

  return paths;
}

const cssPaths = await collectCssFiles(sourceDirectory);
const cssSources = new Map();
const definedTokens = new Set();

for (const path of cssPaths) {
  const source = await readFile(path, "utf8");
  cssSources.set(path, source);

  for (const match of source.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
    definedTokens.add(match[1]);
  }
}

const errors = [];
const globalsSource = cssSources.get(globalsPath) ?? "";

for (const token of requiredTokens) {
  if (!definedTokens.has(token)) {
    errors.push(`src/styles/globals.css: required shadcn token ${token} is missing`);
  }
}

for (const requiredImport of [
  '@import "tailwindcss";',
  '@import "tw-animate-css";',
  '@import "shadcn/tailwind.css";',
]) {
  if (!globalsSource.includes(requiredImport)) {
    errors.push(`src/styles/globals.css: missing ${requiredImport}`);
  }
}

for (const [path, source] of cssSources) {
  const displayPath = relative(frontendRoot, path);

  for (const match of source.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
    if (!definedTokens.has(match[1]) && !tailwindBuiltInTokens.has(match[1])) {
      errors.push(`${displayPath}: undefined design token ${match[1]}`);
    }
  }

  if (path === globalsPath) {
    continue;
  }

  for (const match of source.matchAll(/#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\(/gi)) {
    errors.push(`${displayPath}: raw color value ${match[0]} must be represented by a theme token`);
  }
}

if (errors.length > 0) {
  console.error("Theme token validation failed:\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Theme token validation passed (${definedTokens.size} local tokens, ${cssPaths.length} stylesheets).`,
);

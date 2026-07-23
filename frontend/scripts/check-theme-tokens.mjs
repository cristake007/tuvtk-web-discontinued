import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL("..", import.meta.url));
const sourceDirectory = join(frontendRoot, "src");
const themePath = join(sourceDirectory, "styles", "theme.css");

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

const themeSource = await readFile(themePath, "utf8");
const definedTokens = new Set(
  [...themeSource.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((match) => match[1]),
);

const componentStylePaths = (await collectCssFiles(sourceDirectory)).filter(
  (path) => path !== themePath,
);
const errors = [];

for (const path of componentStylePaths) {
  const source = await readFile(path, "utf8");
  const displayPath = relative(frontendRoot, path);

  for (const match of source.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
    const token = match[1];

    if (!definedTokens.has(token)) {
      errors.push(`${displayPath}: undefined design token ${token}`);
    }

    if (token.startsWith("--palette-")) {
      errors.push(`${displayPath}: raw palette token ${token} must remain inside theme.css`);
    }
  }

  for (const match of source.matchAll(/#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/gi)) {
    errors.push(
      `${displayPath}: raw color value ${match[0]} must be represented by a semantic token`,
    );
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
  `Theme token validation passed (${definedTokens.size} tokens, ${componentStylePaths.length} stylesheets).`,
);

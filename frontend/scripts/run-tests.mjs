import { readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const watch = process.argv.includes("--watch");

async function collectTests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const tests = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      tests.push(...(await collectTests(entryPath)));
    } else if (entry.name.endsWith(".test.ts")) {
      tests.push(entryPath);
    }
  }

  return tests;
}

const tests = (await collectTests(sourceRoot)).sort();

if (tests.length === 0) {
  console.error("No frontend test files were found under frontend/src.");
  process.exit(1);
}

const argumentsList = [];
if (watch) {
  argumentsList.push("--watch");
}
argumentsList.push("--test", ...tests);

const result = spawnSync(process.execPath, argumentsList, {
  cwd: root,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);

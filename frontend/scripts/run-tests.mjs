import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const temporaryRoot = path.join(root, "node_modules", ".tmp");
const outputRoot = path.join(temporaryRoot, "tuvtk-tests");
const buildInfoPath = path.join(temporaryRoot, "tsconfig.test.tsbuildinfo");
const tscPath = path.join(root, "node_modules", "typescript", "bin", "tsc");

async function collectCompiledTests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const tests = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      tests.push(...(await collectCompiledTests(entryPath)));
    } else if (entry.name.endsWith(".test.js")) {
      tests.push(entryPath);
    }
  }

  return tests;
}

await rm(outputRoot, { force: true, recursive: true });
await rm(buildInfoPath, { force: true });
await mkdir(outputRoot, { recursive: true });

const compileResult = spawnSync(
  process.execPath,
  [tscPath, "--project", "tsconfig.test.json", "--pretty", "false"],
  {
    cwd: root,
    stdio: "inherit",
  },
);

if (compileResult.error) {
  throw compileResult.error;
}

if (compileResult.status !== 0) {
  process.exit(compileResult.status ?? 1);
}

await writeFile(
  path.join(outputRoot, "package.json"),
  `${JSON.stringify({ type: "module" }, null, 2)}\n`,
  "utf8",
);

const tests = (await collectCompiledTests(outputRoot)).sort();
if (tests.length === 0) {
  console.error("No compiled frontend tests were found.");
  process.exit(1);
}

const testResult = spawnSync(process.execPath, ["--test", ...tests], {
  cwd: root,
  stdio: "inherit",
});

if (testResult.error) {
  throw testResult.error;
}

process.exit(testResult.status ?? 1);

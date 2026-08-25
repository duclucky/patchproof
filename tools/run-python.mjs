import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const candidates = [
  new URL("../.venv/Scripts/python.exe", import.meta.url),
  new URL("../.venv/bin/python", import.meta.url),
];
const executableUrl = candidates.find((candidate) => fs.existsSync(candidate));
if (!executableUrl) {
  console.error("Project Python environment not found. Create .venv and install the locked dev dependencies.");
  process.exit(1);
}
const executable = fileURLToPath(executableUrl);
const result = spawnSync(executable, ["-X", "utf8", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, PYTHONIOENCODING: "utf-8" },
});
process.exit(result.status ?? 1);

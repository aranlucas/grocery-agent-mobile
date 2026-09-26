import { spawnSync } from "node:child_process";

// `expo install --fix` reinstalls through pnpm, which runs this hook again.
const GUARD = "GROCERY_POSTINSTALL_RUNNING";

if (process.env[GUARD] || process.env.CI || process.env.EAS_BUILD) {
  process.exit(0);
}

const env = { ...process.env, [GUARD]: "1" };

function run(args) {
  return spawnSync("pnpm", ["exec", ...args], { cwd: process.cwd(), env, stdio: "inherit" }).status;
}

if (run(["expo", "install", "--fix"]) !== 0) {
  console.warn("postinstall: `expo install --fix` failed; run it manually.");
}

if (run(["expo-agent-cli", "doctor", "--no-followups"]) !== 0) {
  console.warn("postinstall: expo-doctor reported issues; see the report above.");
}

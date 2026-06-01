import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
  });
  process.exit(result.status ?? 1);
}

const hasConvexDeployKey = Boolean(process.env.CONVEX_DEPLOY_KEY?.trim());
const hasSelfHosted =
  Boolean(process.env.CONVEX_SELF_HOSTED_URL?.trim()) &&
  Boolean(process.env.CONVEX_SELF_HOSTED_ADMIN_KEY?.trim());

if (hasConvexDeployKey || hasSelfHosted) {
  run("bunx", [
    "convex",
    "deploy",
    "--cmd",
    "bun run build",
    "--cmd-url-env-var-name",
    "VITE_CONVEX_URL",
  ]);
}

console.warn(
  "CONVEX_DEPLOY_KEY not set — skipping Convex deploy, building frontend only."
);
console.warn(
  "Add CONVEX_DEPLOY_KEY (and other VITE_* vars) in Vercel for full production."
);

run("bun", ["run", "build"]);

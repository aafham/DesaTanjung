import { spawn } from "node:child_process";

const checks = [
  ["npm", ["run", "lint"]],
  ["npm", ["run", "build"]],
  ["npx", ["playwright", "test", "tests/e2e/auth.spec.ts", "--project=chromium"]],
  [
    "npx",
    [
      "playwright",
      "test",
      "tests/e2e/user-full-flow.spec.ts",
      "--project=chromium",
      "--grep",
      "signed-in resident context",
    ],
  ],
  [
    "npx",
    [
      "playwright",
      "test",
      "tests/e2e/user-full-flow.spec.ts",
      "--project=chromium",
      "--grep",
      "directly download",
    ],
  ],
];

function quoteArg(arg) {
  if (!/[\s"&|<>^]/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/"/g, '\\"')}"`;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const commandLine = [command, ...args.map(quoteArg)].join(" ");
    console.log(`\n> ${commandLine}`);
    const child = spawn(commandLine, {
      shell: true,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

for (const [command, args] of checks) {
  await run(command, args);
}

console.log("\nLive-ready verification completed successfully.");

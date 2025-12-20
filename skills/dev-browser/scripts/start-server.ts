import { serve } from "@/index.js";
import { execSync } from "child_process";
import { mkdirSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tmpDir = join(__dirname, "..", "tmp");
const profileDir = join(__dirname, "..", "profiles");

// Create tmp and profile directories if they don't exist
console.log("Creating tmp directory...");
mkdirSync(tmpDir, { recursive: true });
console.log("Creating profiles directory...");
mkdirSync(profileDir, { recursive: true });

// Install Patchright Chrome browser if not already installed
// Using Chrome (not Chromium) for maximum undetectability
console.log("Checking Patchright browser installation...");

function findPackageManager(): { name: string; command: string } | null {
  const managers = [
    { name: "bun", command: "bunx patchright install chrome" },
    { name: "pnpm", command: "pnpm exec patchright install chrome" },
    { name: "npm", command: "npx patchright install chrome" },
  ];

  for (const manager of managers) {
    try {
      execSync(`which ${manager.name}`, { stdio: "ignore" });
      return manager;
    } catch {
      // Package manager not found, try next
    }
  }
  return null;
}

function isChromeInstalled(): boolean {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const patchrightCacheDir = join(homeDir, ".cache", "ms-playwright");

  if (!existsSync(patchrightCacheDir)) {
    return false;
  }

  // Check for chrome directories (e.g., chrome-1148)
  // Patchright uses the same cache location as Playwright
  try {
    const entries = readdirSync(patchrightCacheDir);
    return entries.some((entry) => entry.startsWith("chrome"));
  } catch {
    return false;
  }
}

try {
  if (!isChromeInstalled()) {
    console.log("Patchright Chrome not found. Installing (this may take a minute)...");

    const pm = findPackageManager();
    if (!pm) {
      throw new Error("No package manager found (tried bun, pnpm, npm)");
    }

    console.log(`Using ${pm.name} to install Patchright Chrome...`);
    execSync(pm.command, { stdio: "inherit" });
    console.log("Chrome installed successfully.");
  } else {
    console.log("Patchright Chrome already installed.");
  }
} catch (error) {
  console.error("Failed to install Patchright browser:", error);
  console.log("You may need to run: npx patchright install chrome");
}

// Check if server is already running
console.log("Checking for existing servers...");
try {
  const res = await fetch("http://localhost:9222", {
    signal: AbortSignal.timeout(1000),
  });
  if (res.ok) {
    console.log("Server already running on port 9222");
    process.exit(0);
  }
} catch {
  // Server not running, continue to start
}

// Clean up stale CDP port if HTTP server isn't running (crash recovery)
// This handles the case where Node crashed but Chrome is still running on 9223
try {
  const pid = execSync("lsof -ti:9223", { encoding: "utf-8" }).trim();
  if (pid) {
    console.log(`Cleaning up stale Chrome process on CDP port 9223 (PID: ${pid})`);
    execSync(`kill -9 ${pid}`);
  }
} catch {
  // No process on CDP port, which is expected
}

console.log("Starting dev browser server...");
const headless = process.env.HEADLESS === "true";
const server = await serve({
  port: 9222,
  headless,
  profileDir,
});

console.log(`Dev browser server started`);
console.log(`  WebSocket: ${server.wsEndpoint}`);
console.log(`  Tmp directory: ${tmpDir}`);
console.log(`  Profile directory: ${profileDir}`);
console.log(`\nReady`);
console.log(`\nPress Ctrl+C to stop`);

// Keep the process running
await new Promise(() => {});

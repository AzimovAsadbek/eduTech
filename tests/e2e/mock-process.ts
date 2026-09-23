import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PID_FILE = path.join(os.tmpdir(), "edutech-e2e-telegram-mock.pid");
const state: { child?: ChildProcess; spawnedByUs: boolean } = { spawnedByUs: false };

export async function isMockUp(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/__health`, { signal: AbortSignal.timeout(500) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function startMock(url: string, rootDir: string): Promise<void> {
  if (await isMockUp(url)) {
    console.log(`[e2e] telegram mock already running at ${url}, reusing it`);
    return;
  }
  const child = spawn("npx", ["tsx", path.join(rootDir, "tests/e2e/telegram-mock.ts")], {
    cwd: rootDir,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env },
  });
  child.stdout?.on("data", (d) => process.stdout.write(`[telegram-mock] ${d}`));
  child.stderr?.on("data", (d) => process.stderr.write(`[telegram-mock] ${d}`));
  state.child = child;
  state.spawnedByUs = true;
  if (child.pid) fs.writeFileSync(PID_FILE, String(child.pid));

  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (await isMockUp(url)) return;
    if (child.exitCode !== null) throw new Error(`telegram mock exited early with code ${child.exitCode}`);
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`telegram mock did not become ready at ${url}`);
}

export async function stopMock(): Promise<void> {
  if (state.child && state.spawnedByUs) {
    state.child.kill("SIGTERM");
    state.child = undefined;
  } else if (fs.existsSync(PID_FILE)) {
    const pid = Number(fs.readFileSync(PID_FILE, "utf8"));
    if (pid) {
      try {
        process.kill(pid, "SIGTERM");
      } catch {
        /* already gone */
      }
    }
  }
  if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
}

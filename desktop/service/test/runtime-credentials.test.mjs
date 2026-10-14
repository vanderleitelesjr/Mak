import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createInterface } from 'node:readline';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('startup replaces old diagnostics without persisting window credentials', { timeout: 20000 }, async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), 'mrmak-runtime-test-'));
  const state = path.join(repo, '.mrmak');
  await mkdir(state);
  await mkdir(path.join(repo, 'workspace'));
  await writeFile(path.join(repo, 'workspace/workspace.json'), '{"entities":[]}');
  await writeFile(path.join(state, 'runtime.json'), JSON.stringify({ token: 'old-test-token', urls: { workspace: '?token=old-test-token' } }));
  const env = { ...process.env };
  delete env.MRMAK_PARENT_PID;
  const child = spawn(process.execPath, [fileURLToPath(new URL('../main.mjs', import.meta.url)), '--repo', repo, '--state', state], {
    env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true,
  });
  const exited = once(child, 'exit');
  // Drain diagnostics without forwarding potentially sensitive startup output.
  child.stderr.resume();
  const lines = createInterface({ input: child.stdout });
  try {
    const ready = await Promise.race([
      (async () => { for await (const line of lines) { const message = JSON.parse(line); if (message.type === 'ready') return message; } throw new Error('Service closed before ready'); })(),
      once(child, 'error').then(([error]) => { throw error; }),
    ]);
    const workspace = new URL(ready.workspace);
    const token = workspace.searchParams.get('token');
    assert.ok(token);
    const saved = JSON.parse(await readFile(path.join(state, 'runtime.json'), 'utf8'));
    assert.deepEqual(saved, { pid: child.pid, origin: workspace.origin });
    const endpoint = workspace.origin + '/api/bootstrap';
    assert.equal((await fetch(endpoint)).status, 401);
    assert.equal((await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })).status, 200);
  } finally {
    lines.close();
    child.stdin.end('quit\n');
    const timer = setTimeout(() => child.kill(), 9000);
    try { const [code] = await exited; assert.equal(code, 0); }
    finally { clearTimeout(timer); }
  }
});

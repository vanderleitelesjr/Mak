// Exercise the actual History -> resume -> close -> restart flow with isolated
// native metadata and deterministic terminals. No user chats or logins are used.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createService } from '../server.mjs';
import { launchBrowser } from './browser.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
await mkdir(path.join(root, '.cache'), { recursive: true });
const repo = await mkdtemp(path.join(root, '.cache/history-ui-'));
const priorHome = process.env.CODEX_HOME;
process.env.CODEX_HOME = path.join(repo, 'codex');
const ids = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'ses_opencodeFixture'];
const chats = ids.map((nativeId, i) => ({ id: `history-${i}`, name: `Saved conversation ${i + 1}`, agent: i === 2 ? 'opencode' : 'codex', cwd: repo, nativeId: null, hasConversation: true, open: false, pinned: i === 0, tabOrder: i, createdAt: '2026-01-01T20:00:00Z', status: 'stopped', cols: 80, rows: 24 }));
await mkdir(path.join(repo, 'workspace'));
await writeFile(path.join(repo, 'workspace/workspace.json'), '{"entities":[]}');
await mkdir(path.join(repo, '.mrmak'));
await writeFile(path.join(repo, '.mrmak/sessions.json'), JSON.stringify(chats));
const folder = path.join(process.env.CODEX_HOME, 'sessions/2026/01/02');
await mkdir(folder, { recursive: true });
for (const [i, chat] of chats.entries()) if (chat.agent === 'codex') await writeFile(path.join(folder, `rollout-test-${ids[i]}.jsonl`), JSON.stringify({ type: 'session_meta', payload: { id: ids[i], cwd: repo, source: 'cli', originator: `mrmak_chat_${chat.id}`, instructions: 'x'.repeat(48000) } }) + '\n');
await writeFile(path.join(repo, '.mrmak/opencode-history-2.json'), JSON.stringify({ chatId: 'history-2', nativeId: ids[2], launchId: 'previous-launch', revision: 1, activity: 'idle' }));
let service, browser;
const launches = [];
async function start() {
  service = await createService({ repo, uiDir: path.join(root, 'dist'), mcpOptions: { home: repo, env: {} } });
  service.sessions.launch = (session, resumeId) => {
    launches.push({ appId: session.id, nativeId: resumeId });
    session.status = 'running'; session.restoreError = null;
    let onExit;
    session.process = { resize() {}, write() {}, onExit(callback) { onExit = callback; return { dispose() {} }; }, kill() { session.process = null; session.status = 'stopped'; onExit?.(); } };
    session.terminal.write(`\r\nRestored original conversation ${resumeId}\r\nReady for your next message.\r\n`);
    service.sessions.changed(session);
  };
}
try {
  await start();
  browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 640, height: 800 } });
  page.setDefaultTimeout(6000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(service.urls.chats);
  for (const [i, chat] of chats.entries()) {
    await page.getByRole('button', { name: 'History', exact: true }).click();
    await page.locator('.history-open').filter({ hasText: chat.name }).click();
    await page.locator('.xterm-rows').filter({ hasText: ids[i] }).waitFor();
    assert.equal(service.sessions.get(chat.id).nativeId, ids[i]);
    assert.equal(await page.locator('.desktop-error').count(), 0);
  }
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await page.locator('.history-filters').getByRole('button', { name: 'OpenCode', exact: true }).click();
  assert.equal(await page.locator('.history-item').count(), 1);
  await page.locator('.history-open').filter({ hasText: chats[2].name }).click();
  // Close and reopen through the same controls the user uses.
  await page.getByRole('button', { name: `Close ${chats[1].name}`, exact: true }).click();
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await page.locator('.history-open').filter({ hasText: chats[1].name }).click();
  await page.locator('.xterm-rows').filter({ hasText: ids[1] }).waitFor();
  await service.sessions.persist();
  const saved = JSON.parse(await readFile(path.join(repo, '.mrmak/sessions.json'), 'utf8'));
  assert.deepEqual(saved.map(s => s.nativeId), ids);
  await service.close();
  await start(); await service.sessions.restore();
  await page.goto(service.urls.chats);
  await page.locator('.chat-tab').first().waitFor();
  assert.deepEqual(service.sessions.list().map(s => s.nativeId), ids);
  assert.equal(service.sessions.list().every(s => s.status === 'running'), true);
  assert.equal(service.sessions.get(chats[0].id).pinned, true);
  assert.equal(launches.length, 7);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(repo, 'history-restored.png') });
  console.log('History UI passed: missing IDs recovered for two same-folder Codex chats and an OpenCode chat; OpenCode filter; close/reopen and service restart preserve original native IDs and pins.');
} finally {
  await browser?.close(); await service?.close();
  if (priorHome === undefined) delete process.env.CODEX_HOME; else process.env.CODEX_HOME = priorHome;
}

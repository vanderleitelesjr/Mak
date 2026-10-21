import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { cp, mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createService } from '../server.mjs';
import { launchBrowser } from './browser.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const repo = await mkdtemp(path.join(root, '.cache/usage-smoke-'));
await mkdir(path.join(repo, 'workspace'));
await writeFile(path.join(repo, 'workspace/workspace.json'), '{"entities":[]}');
await cp(path.join(root, 'dist'), path.join(repo, 'ui'), { recursive: true });
await cp(path.join(root, 'public/assets'), path.join(repo, 'ui/assets'), { recursive: true });
let service, browser;
try {
  service = await createService({ repo, uiDir: path.join(repo, 'ui'), mcpOptions: { home: repo, env: {} } });
  const session = service.sessions.make({ id: 'usage-check', name: 'Usage check', agent: 'codex', cwd: repo, status: 'running', open: true, hasConversation: true, createdAt: new Date().toISOString(), cols: 90, rows: 30 });
  session.process = { write() {}, resize() {}, kill() {} };
  service.sessions.items.set(session.id, session);
  await service.sessions.hydrate(session);
  browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const resetsAt = Math.floor(Date.now() / 1000) + 7200;
  const general = { limitId: 'general', planType: 'plus', primary: { usedPercent: 38, windowMinutes: 300, resetsAt }, secondary: { usedPercent: 68, windowMinutes: 10080, resetsAt } };
  const exclusive = { limitId: 'exclusive', limitName: 'Special model', isExclusive: true, primary: { usedPercent: 82, windowMinutes: 300, resetsAt } };
  await page.route('**/api/sessions/usage-check/stats', route => route.fulfill({ json: { model: 'gpt-6', usage: { agent: 'codex', tokens: { current: 64000, cumulative: 180000, input: 150000, cached: 12000, output: 30000, contextWindow: 256000, contextPercent: 25 }, rateLimits: general, rateLimitsList: [general, exclusive], costUSD: 1.25 } } }));
  await page.goto(service.urls.chats);
  const chip = page.getByRole('button', { name: 'Model usage and limits' });
  await expect(chip).toBeVisible();
  await expect(chip).toContainText('38%');
  await expect(chip).toContainText('68%');
  await expect(chip).toContainText('Special model');
  await expect(chip).toContainText('64k/256k ctx');
  await chip.hover();
  await expect(page.getByRole('tooltip')).toContainText('OpenAI Codex');
  await page.mouse.move(0, 0);
  const set = value => fetch(service.origin + '/api/settings', { method: 'POST', headers: { Authorization: `Bearer ${service.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
  await set({ usageDirection: 'remaining', usageLimitMode: 'general' });
  await expect(chip).toContainText('62%');
  await expect(chip).toContainText('32%');
  await expect(chip).not.toContainText('Special model');
  await page.getByRole('button', { name: 'Group tabs by project', exact: true }).click();
  await expect(page.locator('.chat-group-chip')).toHaveCount(1);
  for (const theme of ['antigravity', 'nordic']) {
    await set({ chatTheme: theme });
    await expect(page.locator('html')).toHaveAttribute('data-workspace-theme', theme);
    for (const width of [390, 768, 1280]) {
      await page.setViewportSize({ width, height: 820 });
      await expect(chip).toBeVisible();
      await set({ usageLimitMode: 'all' });
      await expect(chip).toContainText('Special model');
      await expect.poll(() => page.locator('.chat-status, .usage-chip-block, .usage-chip-cost').evaluateAll(nodes => nodes.every(node => {
        const box = node.getBoundingClientRect();
        return box.left >= 0 && box.right <= innerWidth + 1 && box.top >= 0 && box.bottom <= innerHeight + 1;
      }))).toBe(true);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: path.join(root, `.cache/custom-052-usage-${theme}-${width}.png`) });
    }
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, checks: ['synthetic usage and quota values', 'used/remaining and general/exclusive settings', 'usage tooltip', 'group-by-project action', 'light/dark usage footer at 390/768/1280 px'], fixture: repo }));
} finally { await browser?.close(); await service?.close(); }

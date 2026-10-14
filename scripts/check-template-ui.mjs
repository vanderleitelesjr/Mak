// Real browser checks against an isolated local service, without restoring chats.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createService } from '../desktop/service/server.mjs';
import { launchBrowser } from '../desktop/service/test/browser.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stateDir = await mkdtemp(path.join(root, '.cache/template-ui-'));
const home = path.join(stateDir, 'home'); await mkdir(home);
const service = await createService({ repo: root, stateDir, uiDir: path.join(root, '.cache/desktop-runtime/ui'), restoreSessions: false, mcpOptions: { home, env: {} } });
const { entities } = JSON.parse(await readFile(path.join(root, 'workspace/workspace.json')));
const errors = [], checks = [];
let browser;
try {
  browser = await launchBrowser();
  const page = await browser.newPage({ acceptDownloads: true });
  page.setDefaultTimeout(20000);
  page.on('pageerror', error => errors.push(error.message));
  const frameLocator = () => page.frameLocator('iframe.report-frame');
  const frame = async () => (await page.locator('iframe.report-frame').elementHandle()).contentFrame();
  async function inspectMedia() {
    const dom = await frame();
    const result = await dom.evaluate(async () => {
      const images = [...document.images]; images.forEach(img => { img.loading = 'eager'; });
      await Promise.all(images.map(img => img.decode()));
      return { images: images.length, overflow: document.documentElement.scrollWidth > innerWidth + 2,
        dark: getComputedStyle(document.documentElement).colorScheme,
        english: !/[\u0400-\u04ff]/u.test(document.body.textContent) };
    });
    assert.equal(result.overflow, false); assert.equal(result.dark, 'dark'); assert.equal(result.english, true);
    return result;
  }
  async function previewImage() {
    const dom = frameLocator();
    const image = dom.locator('img:visible').first();
    if (!await image.count()) return;
    await image.click();
    const dialog = dom.getByRole('dialog', { name: 'Image preview' }); await dialog.waitFor();
    await dialog.locator('img').evaluate(img => img.decode());
    const pending = page.waitForEvent('download');
    await dialog.getByRole('link', { name: 'Download', exact: true }).click();
    assert.equal(await (await pending).failure(), null);
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
  }
  for (const width of [1440, 760]) {
    await page.setViewportSize({ width, height: 1060 });
    for (const entity of entities.filter(e => !process.env.MRMAK_QA_GAME_ONLY || e.id === 'my-dream-game')) {
      // Exercise the actual card link, which deliberately has no step index.
      await page.goto(service.urls.workspace + '#/');
      await page.locator(`.entity-card[data-entity="${entity.id}"]`).click();
      const expected = entity.defaultStep ?? entity.steps.length - 1;
      await page.locator('.step-tab[aria-selected="true"]').filter({ hasText: entity.steps[expected].name }).waitFor();
      for (const [index, step] of entity.steps.entries()) {
        await page.locator('.step-tab').nth(index).click();
        if (step.path.endsWith('.html')) {
          await frameLocator().locator('h1:visible').waitFor();
          const media = await inspectMedia();
          await previewImage();
          const prompts = frameLocator().locator('.prompt-disclosure:visible');
          if (await prompts.count()) {
            await prompts.first().locator('summary').click();
            assert.ok((await prompts.first().locator('pre').innerText()).length > 80);
            await prompts.first().locator('summary').click();
          }
          if (step.path === 'report_motion.html') {
            const dom = await frame();
            const durations = await dom.evaluate(async () => Promise.all([...document.querySelectorAll('video')].map(video => new Promise((resolve, reject) => {
              const ready = () => resolve({ duration: video.duration, controls: video.controls });
              if (video.readyState >= 1) return ready();
              video.addEventListener('loadedmetadata', ready, { once: true });
              video.addEventListener('error', () => reject(new Error('Video failed to decode')), { once: true });
            }))));
            assert.equal(durations.length, 8); assert.ok(durations.every(v => v.duration > 5 && v.controls));
            assert.equal(await prompts.count(), 8);
            await dom.locator('video').first().evaluate(v => { v.muted = true; return v.play(); });
            await dom.waitForFunction(() => document.querySelector('video').currentTime > .1);
            await dom.locator('video').first().evaluate(v => v.pause());
          }
          if (entity.id === 'my-dream-game') {
            const dom = frameLocator();
            assert.equal(await dom.getByRole('tab').count(), 4);
            for (const id of ['intro', 'character', 'locations', 'development']) {
              await dom.locator(`[data-page="${id}"]`).click();
              await dom.locator(`#${id}:visible`).waitFor();
              assert.equal(await dom.getByRole('tabpanel').count(), 1);
              await inspectMedia(); await previewImage();
              checks.push({ width, projectSection: id });
              await page.screenshot({ path: path.join(root, `.cache/game-${id}-${width}.png`), animations: 'disabled' });
            }
            await dom.locator('[data-page="intro"]').click();
            await dom.locator('[data-page="intro"]').press('ArrowDown');
            await dom.locator('#character:visible').waitFor();
          }
          checks.push({ width, entity: entity.id, index, ...media });
        } else {
          await page.locator('.mak-markdown h1').waitFor();
          assert.doesNotMatch(await page.locator('.mak-markdown').innerText(), /[\u0400-\u04ff]/u);
          checks.push({ width, entity: entity.id, index, markdown: true });
        }
      }
    }
    // Explicit routes still override the card default, including on reload.
    await page.goto(service.urls.workspace + '#/creative-mcp/1');
    await page.locator('.mak-markdown h1').waitFor();
    await page.reload(); await page.locator('.mak-markdown h1').waitFor();
    // Invalid indices recover to the chosen default.
    await page.goto(service.urls.workspace + '#/creative-mcp/999');
    await frameLocator().locator('h1').waitFor();
    assert.equal(await page.locator('.step-tab[aria-selected="true"]').innerText(), 'Tool shortlist');
  }
  await page.setViewportSize({ width: 1440, height: 1060 });
  await page.goto(service.urls.workspace + '#/my-dream-game');
  await frameLocator().locator('#intro:visible').waitFor();
  await inspectMedia();
  await page.evaluate(async () => Promise.all([...document.images].map(img => img.decode())));
  await page.screenshot({ path: path.join(root, 'docs/assets/workspace.png'), animations: 'disabled' });
  // Both provider entries must expose the complete readable skill and resources.
  await page.getByRole('button', { name: 'Toggle skills', exact: true }).click();
  for (const provider of ['Claude', 'Codex']) {
    await page.locator('.skill-locations').getByRole('button', { name: provider, exact: true }).click();
    await page.getByRole('treeitem', { name: /^fal-ai-generation$/ }).click();
    await page.getByRole('treeitem', { name: /^SKILL.md/ }).click();
    await page.getByRole('heading', { name: 'fal.ai generation', exact: true }).waitFor();
    await page.getByRole('heading', { name: 'Run and retain the job', exact: true }).waitFor();
    const documentText = await page.locator('.mak-markdown').innerText();
    assert.ok(documentText.length > 3000);
    assert.doesNotMatch(documentText, /[A-Z]:[\\/]Users[\\/]|[\u0400-\u04ff]/iu);
    await page.getByRole('button', { name: 'Close file preview' }).click();
    checks.push({ skillProvider: provider, completeInstructions: true });
  }
  assert.deepEqual(errors, []);
  const focused = Boolean(process.env.MRMAK_QA_GAME_ONLY);
  await writeFile(path.join(root, `.cache/template-${focused ? 'game-' : ''}ui-result.json`), JSON.stringify({ passed: true, focused, checks, errors }, null, 2));
  console.log(`Template UI passed: ${checks.length} cases; ${focused ? 'game navigation, images, downloads, route defaults and both skill previews' : 'card defaults, explicit routes, game navigation, prompts, images, downloads, eight videos and both skill previews'}.`);
} finally { await browser?.close(); await service.close(); }

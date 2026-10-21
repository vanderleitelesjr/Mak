// Exercise the actual local report, shared theme and image viewer in a headless
// browser. Does not use or change the owner's running application/session.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../../desktop/service/test/browser.mjs';
import { serveReport } from '../../desktop/service/report-chrome.mjs';

const folder = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(folder, '../..');
const workspace = path.join(root, 'workspace');
const registry = JSON.parse(await readFile(path.join(workspace, 'workspace.json'), 'utf8'));
const card = registry.entities.filter(entity => entity.id === 'headband-fit');
assert.equal(card.length, 1);
assert.equal(card[0].folder, path.basename(folder));
assert.deepEqual(card[0].steps, [{ name: 'Fit and downloads', path: 'report.html' }]);
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!file.startsWith(workspace + path.sep)) { response.writeHead(403).end(); return; }
    const info = await stat(file);
    if (path.extname(file) === '.html') { await serveReport(request, response, file, info, {}); return; }
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Content-Length': info.size });
    if (request.method === 'HEAD') response.end(); else createReadStream(file).pipe(response);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/workspace/${path.basename(folder)}/`;
let browser;
const results = [];
try {
  browser = await launchBrowser();
  const page = await browser.newPage({ acceptDownloads: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const theme of ['dark', 'light']) {
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base + 'report.html?mrmak-theme=' + theme);
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.locator('details').evaluateAll(nodes => nodes.forEach(node => { node.open = true; }));
      for (const image of await page.locator('main img').all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(node => node.decode());
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Overflow at ${width}/${theme}`);
      const background = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor);
      assert.equal(background, theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(16, 17, 21)');
      await page.locator('main img').first().click();
      const dialog = page.getByRole('dialog', { name: 'Image preview' });
      await dialog.waitFor();
      assert.ok(await dialog.getByRole('link', { name: 'Download', exact: true }).getAttribute('download'));
      await dialog.getByRole('button', { name: '100%', exact: true }).click();
      await dialog.getByRole('button', { name: 'Fit', exact: true }).click();
      await dialog.getByRole('button', { name: 'Close', exact: true }).click();
      assert.equal(await dialog.isVisible(), false);
      if ((width === 1440 && theme === 'light') || (width === 390 && theme === 'dark')) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: path.join(folder, `report_${width}_${theme}.png`) });
      }
      results.push({ width, theme, images: await page.locator('main img').count(), noHorizontalOverflow: true, imagePreviewAndControls: true });
    }
  }
  const links = await page.locator('main a[href]').evaluateAll(nodes => [...new Set(nodes.map(node => node.href))]);
  for (const link of links) {
    const response = await page.request.head(link);
    assert.equal(response.status(), 200, link);
    assert.ok(Number(response.headers()['content-length']) > 0, link);
  }
  const downloadEvent = page.waitForEvent('download');
  await page.locator('.downloads a').first().click();
  const download = await downloadEvent;
  assert.equal(download.suggestedFilename(), 'Headband_58cm_PLA_fit_v2_Bambu_A1.stl');
  assert.equal(await download.failure(), null);
  assert.deepEqual(errors, []);
  const result = { registered: true, viewports: results, linksChecked: links.length, completeA1Download: true, browserErrors: errors };
  await writeFile(path.join(folder, 'preview_verification.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, writeFile, symlink, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createService } from '../server.mjs';
import { validateCard, validateCardDraft, cardSourceUrl, CARD_MAX_ITEMS } from '../card-schema.mjs';
import { MobileReports } from '../mobile-reports.mjs';
import { saveJson } from '../util.mjs';

const sample = () => ({ format: 'mrmak-card', version: 1, template: 'gallery', title: 'Reference gallery', summary: 'A **shared** source of content.', items: [{ id: 'first', title: 'First concept', body: 'Review the shape.', status: 'review', prompt: 'A round character.' }] });
const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aYa4AAAAASUVORK5CYII=', 'base64');
async function fixture(t) {
  const repo = await mkdtemp(path.join(os.tmpdir(), 'mrmak-cards-'));
  await mkdir(path.join(repo, 'workspace', 'sample'), { recursive: true });
  await mkdir(path.join(repo, 'ui')); await writeFile(path.join(repo, 'ui', 'index.html'), '<!doctype html><title>Test</title>');
  const file = path.join(repo, 'workspace/sample/content.card.json');
  const original = JSON.stringify(sample(), null, 2) + '\n'; await writeFile(file, original);
  await writeFile(path.join(repo, 'workspace/sample/report.html'), '<h1>Keep the custom report</h1>');
  const entity = { id: 'sample', title: 'Sample project', folder: 'sample', type: 'group', category: 'research', status: 'active', created: '2026-01-01', custom: 'keep', steps: [{ name: 'Editable gallery', path: 'content.card.json', viewer: 'card' }, { name: 'Original HTML', path: 'report.html' }] };
  await writeFile(path.join(repo, 'workspace/workspace.json'), JSON.stringify({ entities: [entity], customRoot: 'keep' }));
  const service = await createService({ repo, uiDir: path.join(repo, 'ui') });
  t.after(async () => { await service.close(); assert.equal(path.dirname(repo), path.resolve(os.tmpdir())); assert.ok(path.basename(repo).startsWith('mrmak-cards-')); await rm(repo, { recursive: true, force: true }); });
  const request = (route, body, method, extra = {}) => fetch(`${service.origin}/api${route}`, { method: method || (body === undefined ? 'GET' : 'POST'), headers: { Authorization: `Bearer ${service.token}`, Origin: service.origin, 'Content-Type': 'application/json', ...extra }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const read = async () => (await request('/workspace/cards/sample/0')).json();
  return { repo, file, original, service, request, read, entity };
}

test('editable card schema rejects active content, ambiguous IDs and incompatible documents', () => {
  assert.equal(validateCard(sample()).template, 'gallery');
  for (const document of [null, [], {}, { ...sample(), version: 2 }, { ...sample(), template: 'custom-code' }, { ...sample(), script: 'alert(1)' }, { ...sample(), title: '' }, { ...sample(), items: Array.from({ length: CARD_MAX_ITEMS + 1 }, (_, index) => ({ id: String(index), title: 'Item' })) }, { ...sample(), items: [sample().items[0], sample().items[0]] }]) assert.throws(() => validateCard(document));
  for (const imagePath of ['../secret.png', '/private.png', 'file:///private.png', 'https://remote.example/image.png', 'media\\test.png', 'media/%2e%2e/secret.png', 'media/.secret.png', 'media/payload.svg', 'image.png?token=secret']) assert.throws(() => validateCard({ ...sample(), items: [{ ...sample().items[0], image: imagePath }] }));
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'file:///private', 'https://user:password@example.test', '/relative']) assert.throws(() => validateCard({ ...sample(), items: [{ ...sample().items[0], url }] }));
  assert.doesNotThrow(() => validateCard({ ...sample(), items: [{ ...sample().items[0], image: 'media/reference.webp', url: 'https://example.test/reference' }] }));
  const incomplete = { ...sample(), title: '', items: [{ id: 'unfinished', title: '', url: 'https://' }] };
  assert.doesNotThrow(() => validateCardDraft(incomplete));
  assert.throws(() => validateCard(incomplete));
  assert.equal(cardSourceUrl('https://'), undefined);
  assert.equal(cardSourceUrl('javascript:alert(1)'), undefined);
  assert.equal(cardSourceUrl('https://user:password@example.test'), undefined);
  assert.equal(cardSourceUrl('https://example.test/research'), 'https://example.test/research');
});

test('editing is authenticated and restricted to registered card tabs', async t => {
  const { request, file, original } = await fixture(t);
  assert.equal((await request('/workspace/cards/sample/0', undefined, 'GET', { Authorization: '' })).status, 401);
  assert.equal((await request('/workspace/cards/sample/0', undefined, 'GET', { Origin: 'https://untrusted.example' })).status, 403);
  for (const route of ['/workspace/cards/sample/1', '/workspace/cards/missing/0', '/workspace/cards/sample/99']) assert.equal((await request(route)).status, 404);
  for (const body of [null, [], { title: 'A', template: 'code' }, { title: 'A', template: 'gallery', folder: '../outside' }]) assert.equal((await request('/workspace/cards', body)).status, 400);
  for (const body of [null, [], { document: sample() }, { document: { ...sample(), version: 99 }, revision: '0'.repeat(64) }]) assert.equal((await request('/workspace/cards/sample/0', body, 'PUT')).status, 400);
  assert.equal(await readFile(file, 'utf8'), original);
});

test('save preserves custom reports and creates an exact recovery copy; simultaneous stale saves conflict', async t => {
  const { request, read, file, repo, original, service, entity } = await fixture(t);
  const snapshot = await read(); assert.match(snapshot.revision, /^[a-f0-9]{64}$/);
  const a = { ...snapshot.document, title: 'Changed content', items: [...snapshot.document.items, { id: 'second', title: 'Second concept', body: '**Editable notes**' }] };
  const results = await Promise.all([request('/workspace/cards/sample/0', { ...snapshot, document: a }, 'PUT'), request('/workspace/cards/sample/0', { ...snapshot, document: { ...a, title: 'Concurrent overwrite' } }, 'PUT')]);
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
  const saved = await results.find(result => result.status === 200).json();
  assert.notEqual(saved.revision, snapshot.revision);
  assert.equal(JSON.parse(await readFile(file, 'utf8')).title, saved.document.title);
  const backups = await readdir(path.join(repo, '.mrmak/card-backups'));
  assert.equal(backups.filter(file => file.endsWith('.card.json')).length, 1);
  assert.equal(await readFile(path.join(repo, '.mrmak/card-backups', backups.find(file => file.endsWith('.card.json'))), 'utf8'), original);
  const registry = JSON.parse(await readFile(path.join(repo, 'workspace/workspace.json'), 'utf8'));
  assert.equal(registry.customRoot, 'keep'); assert.equal(registry.entities[0].title, entity.title); assert.equal(registry.entities[0].custom, 'keep');
  assert.deepEqual(registry.entities[0].steps, entity.steps); assert.ok(registry.entities[0].updated);
  assert.equal(await readFile(path.join(repo, 'workspace/sample/report.html'), 'utf8'), '<h1>Keep the custom report</h1>');
  assert.match((await service.workspace.read('sample', 0)).text, /Second concept/);
  assert.ok((await readdir(path.dirname(file))).every(name => !name.endsWith('.tmp')));
});

test('an agent edit invalidates the editor revision without being overwritten', async t => {
  const { read, request, file } = await fixture(t);
  const snapshot = await read(); const agent = { ...sample(), title: 'Agent updated this' };
  await writeFile(file, JSON.stringify(agent));
  const result = await request('/workspace/cards/sample/0', { ...snapshot, document: { ...sample(), title: 'Browser draft' } }, 'PUT');
  assert.equal(result.status, 409); assert.match((await result.json()).error, /draft is kept/);
  assert.deepEqual(JSON.parse(await readFile(file, 'utf8')), agent);
});

test('new cards keep registry data, use unique local folders and update their listing after a save', async t => {
  const { request, repo } = await fixture(t);
  const responses = await Promise.all([request('/workspace/cards', { title: 'My research', template: 'research' }), request('/workspace/cards', { title: 'My research', template: 'gallery' })]);
  assert.ok(responses.every(response => response.status === 201));
  const [one, two] = await Promise.all(responses.map(response => response.json()));
  assert.notEqual(one.entity.id, two.entity.id); assert.equal(one.entity.pinned, undefined); assert.equal(one.entity.sample, undefined);
  const updated = { ...one.document, title: 'Reviewed research', summary: 'What worked.' };
  assert.equal((await request(`/workspace/cards/${one.entity.id}/0`, { document: updated, revision: one.revision }, 'PUT')).status, 200);
  const registry = JSON.parse(await readFile(path.join(repo, 'workspace/workspace.json'), 'utf8'));
  assert.equal(registry.entities.length, 3); assert.equal(registry.customRoot, 'keep');
  assert.equal(registry.entities.find(entity => entity.id === one.entity.id).title, updated.title);
  assert.equal(registry.entities.find(entity => entity.id === one.entity.id).description, updated.summary);
});

test('image import stays in the card folder, checks file type and never trusts the upload filename', async t => {
  const { service, repo } = await fixture(t);
  const upload = (bytes, name, extra = {}) => fetch(`${service.origin}/api/workspace/cards/sample/0/images?name=${encodeURIComponent(name)}`, { method: 'POST', headers: { Authorization: `Bearer ${service.token}`, Origin: service.origin, 'Content-Type': 'application/octet-stream', ...extra }, body: bytes });
  assert.equal((await upload(image, 'picture.png', { Authorization: '' })).status, 401);
  assert.equal((await upload(Buffer.from('<script>bad()</script>'), 'image.png')).status, 400);
  const result = await upload(image, '../../outside.exe'); assert.equal(result.status, 201);
  const saved = await result.json(); assert.match(saved.image, /^media\/[a-zA-Z0-9_-]+\.png$/);
  assert.deepEqual(await readFile(path.join(repo, 'workspace/sample', saved.image)), image);
});

test('card edits and uploads reject folders linked outside the Workspace', async t => {
  const { repo, request, service } = await fixture(t);
  const outside = await mkdtemp(path.join(os.tmpdir(), 'mrmak-cards-outside-'));
  t.after(async () => { assert.equal(path.dirname(outside), path.resolve(os.tmpdir())); await rm(outside, { recursive: true, force: true }); });
  await writeFile(path.join(outside, 'content.card.json'), JSON.stringify(sample()));
  await symlink(outside, path.join(repo, 'workspace/escaped'), process.platform === 'win32' ? 'junction' : 'dir');
  const registryFile = path.join(repo, 'workspace/workspace.json'), registry = JSON.parse(await readFile(registryFile, 'utf8'));
  registry.entities.push({ ...registry.entities[0], id: 'escaped', folder: 'escaped' });
  await writeFile(registryFile, JSON.stringify(registry));
  assert.equal((await request('/workspace/cards/escaped/0')).status, 403);
  await symlink(outside, path.join(repo, 'workspace/sample/media'), process.platform === 'win32' ? 'junction' : 'dir');
  const result = await fetch(`${service.origin}/api/workspace/cards/sample/0/images?name=image.png`, { method: 'POST', headers: { Authorization: `Bearer ${service.token}`, Origin: service.origin }, body: image });
  assert.equal(result.status, 403); assert.deepEqual(await readdir(outside), ['content.card.json']);
});

test('phone previews receive validated content and a scoped image grant', async t => {
  const { repo } = await fixture(t);
  const device = { id: 'paired', expires: Date.now() + 60000 };
  const gateway = { repo, state: { devices: [device] } };
  const reports = new MobileReports(gateway);
  const preview = await reports.open(device, { entityId: 'sample', step: 0 });
  assert.equal(preview.kind, 'card'); assert.deepEqual(preview.document, sample());
  assert.equal(preview.statePersistence, false); assert.match(preview.url, /^\/mobile\/view\/[^/]+\/workspace\/sample\/content.card.json$/);
  await writeFile(path.join(repo, 'workspace/sample/content.card.json'), JSON.stringify({ ...sample(), version: 99 }));
  await assert.rejects(reports.open(device, { entityId: 'sample' }), /version is not supported/);
});

test('atomic saves run the revision guard inside the write queue and retain a newer file', async t => {
  const { file, original } = await fixture(t);
  let checked = false;
  await assert.rejects(saveJson(file, sample(), { beforeReplace: async () => { checked = true; throw Object.assign(new Error('Stale revision'), { status: 409 }); } }), { status: 409 });
  assert.equal(checked, true); assert.equal(await readFile(file, 'utf8'), original);
  assert.ok((await readdir(path.dirname(file))).every(name => !name.endsWith('.tmp')));
});

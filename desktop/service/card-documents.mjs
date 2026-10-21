import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, realpath, writeFile, unlink, rmdir } from 'node:fs/promises';
import path from 'node:path';
import { CARD_FORMAT, CARD_VERSION, CARD_MAX_BYTES, cardTemplates, localCardPath, validateCard } from './card-schema.mjs';
import { realFile, saveJson, within } from './util.mjs';
import { localDay } from './workspace.mjs';

const hash = source => createHash('sha256').update(source).digest('hex');
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const conflict = () => fail('This card changed on disk. Your draft is kept. Review the latest version before saving.', 409);
const sourceOf = document => JSON.stringify(document, null, 2) + '\n';
const MAX_IMAGE_BYTES = 16 * 1024 * 1024;

export class CardDocuments {
  constructor(workspace) { this.workspace = workspace; this.repo = workspace.repo; }
  // Share the registry queue with metadata edits and new-card registration.
  write(operation) {
    const result = this.workspace.writes.catch(() => {}).then(operation);
    // A rejected revision is an expected response, not a failed shutdown job.
    this.workspace.writes = result.catch(() => {});
    return result;
  }
  async resolve(id, step) {
    if (!Number.isInteger(step) || step < 0) fail('Choose a card tab.');
    const entity = (await this.workspace.registry()).entities.find(item => item.id === id);
    const selected = entity?.steps?.[step];
    if (!entity || selected?.viewer !== 'card' || !localCardPath(entity.folder) || !localCardPath(selected.path) || !selected.path.endsWith('.card.json')) fail('This tab is not an editable card.', 404);
    const workspaceRoot = await realpath(path.join(this.repo, 'workspace'));
    const { file: folder, info: folderInfo } = await realFile(workspaceRoot, entity.folder);
    if (!folderInfo.isDirectory()) fail('Card folder not found.', 404);
    const { file, info } = await realFile(folder, selected.path);
    if (!info.isFile() || info.size > CARD_MAX_BYTES) fail('Choose an editable card of up to 1 MB.');
    return { entity, selected, file, root: path.dirname(file), workspaceRoot };
  }
  async read(id, step) {
    const target = await this.resolve(id, step), source = await readFile(target.file, 'utf8');
    if (Buffer.byteLength(source) > CARD_MAX_BYTES) fail('Choose an editable card of up to 1 MB.');
    let document; try { document = JSON.parse(source); } catch { fail('This card contains invalid JSON. Its original file has been kept.'); }
    return { document: validateCard(document), revision: hash(source) };
  }
  async registryChange(update) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const source = await readFile(this.workspace.file, 'utf8'), registry = JSON.parse(source);
      if (!Array.isArray(registry.entities)) fail('Workspace registry is not ready.');
      update(registry);
      try {
        await saveJson(this.workspace.file, registry, { beforeReplace: async () => {
          if (await readFile(this.workspace.file, 'utf8') !== source) throw Object.assign(new Error('Workspace changed while saving.'), { code: 'ESTALE' });
        } });
        return;
      } catch (error) { if (error.code !== 'ESTALE' || attempt === 5) throw error; }
    }
  }
  save(id, step, options) {
    if (!options || typeof options !== 'object' || Array.isArray(options) || Object.keys(options).some(key => !['revision', 'document'].includes(key))) fail('Send the card and its current revision.');
    let { revision, document } = options;
    if (typeof revision !== 'string' || !/^[a-f0-9]{64}$/.test(revision)) fail('Reopen the card to get its current revision.');
    const validated = validateCard(document), replacement = sourceOf(validated);
    if (Buffer.byteLength(replacement) > CARD_MAX_BYTES) fail('Keep this card under 1 MB.');
    // Snapshot caller input before waiting for another write.
    document = JSON.parse(replacement);
    return this.write(async () => {
      const target = await this.resolve(id, step), source = await readFile(target.file, 'utf8');
      if (hash(source) !== revision) conflict();
      const backups = path.join(this.repo, '.mrmak', 'card-backups');
      await mkdir(backups, { recursive: true });
      const actualBackups = await realpath(backups);
      if (!within(await realpath(this.repo), actualBackups)) fail('The recovery folder must stay inside this repository.');
      const backupId = `${Date.now()}-${randomUUID()}`;
      await writeFile(path.join(actualBackups, `${backupId}.card.json`), source, { flag: 'wx', mode: 0o600 });
      await writeFile(path.join(actualBackups, `${backupId}.json`), sourceOf({ entityId: id, step, path: path.relative(this.repo, target.file), revision, savedAt: new Date().toISOString() }), { flag: 'wx', mode: 0o600 });
      await saveJson(target.file, document, { beforeReplace: async () => {
        const current = await this.resolve(id, step);
        if (current.file !== target.file || hash(await readFile(current.file)) !== revision) conflict();
      } });
      let warning;
      try {
        await this.registryChange(registry => {
          const entity = registry.entities.find(item => item.id === id);
          if (!entity) throw new Error('Card was removed from the Workspace.');
          entity.updated = localDay();
          if (entity.steps.length === 1) {
            entity.title = document.title;
            entity.description = (document.summary || '').replace(/\s+/g, ' ').slice(0, 240);
          }
        });
      } catch { warning = 'Your content was saved, but the Workspace listing could not be refreshed. Reopen the card to refresh its listing.'; }
      this.workspace.changed();
      return { document, revision: hash(replacement), ...(warning ? { warning } : {}) };
    });
  }
  create(options) {
    if (!options || typeof options !== 'object' || Array.isArray(options) || Object.keys(options).some(key => !['title', 'template'].includes(key))) fail('Enter a title and choose Gallery or Research.');
    const { title, template } = options;
    if (typeof title !== 'string' || !title.trim() || title.length > 200 || /[\x00-\x1f]/.test(title) || !cardTemplates.includes(template)) fail('Enter a title and choose Gallery or Research.');
    return this.write(async () => {
      const document = { format: CARD_FORMAT, version: CARD_VERSION, template, title: title.trim(), summary: '', items: [] };
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || template;
      const id = `${slug}-${randomUUID().slice(0, 8)}`, folder = `${localDay()}_${id}`;
      const workspaceRoot = await realpath(path.join(this.repo, 'workspace'));
      const directory = path.join(workspaceRoot, folder), file = path.join(directory, 'content.card.json');
      const entity = { id, title: document.title, description: '', type: 'standalone', category: template === 'gallery' ? 'image-gen' : 'research', created: localDay(), updated: localDay(), folder, steps: [{ name: template === 'gallery' ? 'Gallery' : 'Research', path: 'content.card.json', viewer: 'card' }], defaultStep: 0, status: 'active' };
      await mkdir(directory);
      await writeFile(file, sourceOf(document), { flag: 'wx' });
      try { await this.registryChange(registry => { registry.entities.push(entity); }); }
      catch (error) { await unlink(file).catch(() => {}); await rmdir(directory).catch(() => {}); throw error; }
      this.workspace.changed();
      return { entity, document, revision: hash(sourceOf(document)) };
    });
  }
  async image(id, step, request, name) {
    const target = await this.resolve(id, step);
    if (Number(request.headers['content-length']) > MAX_IMAGE_BYTES) fail('Choose an image of up to 16 MB.', 413);
    const chunks = []; let length = 0;
    for await (const chunk of request) { length += chunk.length; if (length > MAX_IMAGE_BYTES) fail('Choose an image of up to 16 MB.', 413); chunks.push(chunk); }
    const bytes = Buffer.concat(chunks);
    const extension = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png'
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'jpg'
        : /^GIF8[79]a$/.test(bytes.subarray(0, 6).toString('ascii')) ? 'gif'
          : bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP' ? 'webp' : null;
    if (!extension) fail('Choose a PNG, JPEG, WebP or GIF image.');
    const media = path.join(target.root, 'media'); await mkdir(media, { recursive: true });
    const { file: actualMedia, info } = await realFile(target.root, 'media');
    if (!info.isDirectory()) fail('The image folder is not a directory.');
    const stem = path.basename(String(name || 'image')).replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 60) || 'image';
    const filename = `${stem}-${randomUUID().slice(0, 8)}.${extension}`;
    await writeFile(path.join(actualMedia, filename), bytes, { flag: 'wx' });
    return { image: `media/${filename}` };
  }
}

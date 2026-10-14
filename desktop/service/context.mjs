import path from 'node:path';
import os from 'node:os';
import { readFile, realpath, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { commandPath } from './agents.mjs';
import { within } from './util.mjs';
const execute = promisify(execFile);

export class ContextLibrary {
  constructor(repo) {
    this.repo = repo;
    this.skillRoots = [path.join(repo, '.agents', 'skills'), path.join(repo, '.claude', 'skills'), path.join(os.homedir(), '.agents', 'skills'), path.join(os.homedir(), '.codex', 'skills'), path.join(os.homedir(), '.codex', 'plugins', 'cache')];
  }
  async orientation() {
    const names = ['AGENTS.md', 'context/me.md', 'context/identity.md', 'context/goals.md', 'context/preferences.md', 'desktop/coordinator.md'];
    const parts = await Promise.all(names.map(async name => {
      const text = await readFile(path.join(this.repo, name), 'utf8').catch(() => '');
      return text ? `## ${name}\n${text.slice(0, 14000)}` : '';
    }));
    return parts.filter(Boolean).join('\n\n').slice(0, 38000);
  }
  async skills(query = '') {
    const rg = commandPath('rg');
    if (!rg) return { skills: [], note: 'The rg file search tool is unavailable. Workers can still use their own skills.' };
    const roots = [];
    for (const root of this.skillRoots) if ((await stat(root).catch(() => null))?.isDirectory()) roots.push(root);
    if (!roots.length) return { skills: [] };
    const { stdout } = await execute(rg, ['--files', '--hidden', '-g', 'SKILL.md', '-g', '!node_modules', '-g', '!target', ...roots], { windowsHide: true, maxBuffer: 1024 * 1024 }).catch(error => ({ stdout: error.stdout || '' }));
    const result = [];
    const seen = new Set();
    for (const file of stdout.trim().split(/\r?\n/).filter(Boolean)) {
      const text = await readFile(file, 'utf8').catch(() => '');
      const name = /^name:\s*(.+)$/m.exec(text)?.[1]?.replace(/^['"]|['"]$/g, '') || path.basename(path.dirname(file));
      const description = /^description:\s*(.+)$/m.exec(text)?.[1]?.replace(/^['"]|['"]$/g, '') || text.split('\n').find(line => line && !line.startsWith('#')) || '';
      if (seen.has(name) || (query && !`${name} ${description}`.toLowerCase().includes(query.toLowerCase()))) continue;
      seen.add(name); result.push({ name, description: description.slice(0, 260), path: file });
    }
    return { skills: result.slice(0, 180), total: result.length };
  }
  async read(file, offset = 0) {
    const actual = await realpath(path.resolve(this.repo, file));
    const trustedSkill = (await Promise.all(this.skillRoots.map(root => realpath(root).catch(() => null)))).some(root => root && within(root, actual));
    const relative = path.relative(this.repo, actual);
    const privateFile = relative.split(/[\\/]/).some(part => part.startsWith('.'));
    const credential = /(?:^|[/\\])(?:\.env(?:\..*)?|auth\.[^/\\]+|tokens?\.[^/\\]+|credentials\.[^/\\]+|settings\.local\.json)$/i.test(actual);
    if ((!within(this.repo, actual) && !trustedSkill) || (!trustedSkill && privateFile) || credential || !/\.(md|txt|json|toml|ya?ml)$/i.test(actual)) throw new Error('Read a repository context document or an installed skill. Private runtime and credential files are excluded.');
    if ((await stat(actual)).size > 2 * 1024 * 1024) throw new Error('Choose a context document smaller than 2 MB.');
    const text = await readFile(actual, 'utf8');
    const start = Math.max(0, Number(offset) || 0);
    return { path: actual, text: text.slice(start, start + 24000), nextOffset: start + 24000 < text.length ? start + 24000 : null };
  }
  async search(query) {
    if (typeof query !== 'string' || !query.trim() || query.length > 200) throw new Error('Use a short context search phrase.');
    const rg = commandPath('rg');
    if (!rg) throw new Error('The rg context search tool is unavailable.');
    const roots = ['context', 'processes', 'knowledge', 'projects'].map(folder => path.join(this.repo, folder));
    const { stdout } = await execute(rg, ['-n', '-i', '--fixed-strings', '--max-count', '2', '-g', '*.md', '-g', '!node_modules', '--', query, ...roots], { windowsHide: true, maxBuffer: 128 * 1024 }).catch(error => ({ stdout: error.stdout || '' }));
    return { matches: stdout.slice(0, 18000), truncated: stdout.length > 18000 };
  }
}

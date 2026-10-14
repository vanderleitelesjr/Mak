// Materialize portable, complete Claude skills from the maintained source.
// No Windows symlink privileges are needed. Never delete recipient-added skills.
import { readdir, readFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, '.agents/skills');
const destination = path.join(root, '.claude/skills');
const check = process.argv.includes('--check');
let files = 0;
const differences = [];

async function visit(relative = '') {
  for (const entry of await readdir(path.join(source, relative), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['__pycache__', 'node_modules'].includes(entry.name)) continue;
    const name = path.join(relative, entry.name);
    // Downloaded vision models and logs are local runtime state, not skill source.
    if (name.replaceAll('\\', '/') === 'img2threejs/runtime') continue;
    if (entry.isDirectory()) { await visit(name); continue; }
    if (!entry.isFile() || /\.(?:pyc|pyo)$/.test(entry.name)) continue;
    const from = path.join(source, name), to = path.join(destination, name);
    const a = await readFile(from), b = await readFile(to).catch(() => null);
    if (!b || !a.equals(b)) {
      if (check) differences.push(name);
      else { await mkdir(path.dirname(to), { recursive: true }); await copyFile(from, to); }
    }
    files++;
  }
}
await visit();
if (differences.length) {
  console.error(`Claude skills differ in ${differences.length} files. Run npm run skills:sync after editing .agents/skills, or move intended Claude edits into that source first.`);
  process.exitCode = 1;
} else console.log(`${files} skill files ${check ? 'verified identical' : 'synchronized'} for Codex and Claude.`);

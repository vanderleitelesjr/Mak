// Tauri currently caches this launcher with mode 0770. AppImage packaging
// assigns root ownership, so other users cannot execute AppRun.wrapped.
// Seed the SAME upstream launcher with 0755 before Tauri copies it to AppDir.
import { createHash } from 'node:crypto';
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

if (process.platform !== 'linux' || process.arch !== 'x64') throw new Error('This release preparation supports Linux x86_64.');
const checksum = 'f30140a43a0a59e46db21bdefdf749b9e9f2c6946e92afabbacf98b8ae73fb4f';
const url = 'https://github.com/tauri-apps/binary-releases/releases/download/apprun-old/AppRun-x86_64';
const directory = path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'), 'tauri');
const launcher = path.join(directory, 'AppRun-x86_64');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
await mkdir(directory, { recursive: true });
const existing = await readFile(launcher).catch(() => null);
if (!existing || hash(existing) !== checksum) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Official AppRun download failed: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (hash(bytes) !== checksum) throw new Error('AppRun checksum changed; review the upstream binary before updating the pin.');
  const temporary = `${launcher}.mrmak-${process.pid}`;
  await writeFile(temporary, bytes, { mode: 0o755, flag: 'wx' });
  await rename(temporary, launcher);
}
await chmod(launcher, 0o755);
console.log('Prepared the verified Tauri AppRun launcher with permissions 0755.');

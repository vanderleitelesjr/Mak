import { cp, mkdir, readFile, writeFile, access, realpath, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtime = path.join(repo, '.cache', 'desktop-runtime');
if (!['win32', 'linux', 'darwin'].includes(process.platform)) throw new Error(`Unsupported desktop platform: ${process.platform}`);
// Clear only this generated staging directory, after verifying its resolved path.
const actualRuntime = await realpath(runtime).catch(() => null);
if (actualRuntime) {
  const expected = path.join(await realpath(repo), '.cache', 'desktop-runtime');
  if (actualRuntime.toLowerCase() !== expected.toLowerCase()) throw new Error('Refusing to clear a staging directory outside this repository');
  await rm(actualRuntime, { recursive: true });
}
await mkdir(runtime, { recursive: true });
// npm may be installed separately from Node (system packages and nvm do this),
// and npm_execpath can point at an old Node installation after switching
// versions. Prefer a valid npm_execpath, then resolve the active npm command.
const configuredNpm = process.env.npm_execpath;
const npmScript = configuredNpm && await access(configuredNpm).then(() => configuredNpm).catch(() => null);
const npmCommand = npmScript || (process.platform === 'win32' ? 'npm.cmd' : 'npm');
const run = (args, cwd) => {
  const command = npmScript ? process.execPath : npmCommand;
  const commandArgs = npmScript ? [npmScript, ...args] : args;
  const result = spawnSync(command, commandArgs, { cwd, stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) throw new Error(`npm ${args.join(' ')} failed: ${result.error?.message || `exit ${result.status}`}`);
};
run(['run', 'build'], repo);
// Homebrew's node is a small launcher linked to libnode.dylib and cannot run from
// the app bundle. On macOS, bundle the official self-contained build of the same
// version instead (checksum-verified, cached under .cache/node-download).
async function portableNode() {
  if (process.platform !== 'darwin') return process.execPath;
  const linked = spawnSync('otool', ['-L', process.execPath], { encoding: 'utf8' }).stdout || '';
  if (!/libnode\./.test(linked)) return process.execPath;
  const name = `node-${process.version}-darwin-${process.arch}`;
  const cache = path.join(repo, '.cache', 'node-download');
  const binary = path.join(cache, name, 'bin', 'node');
  if (await access(binary).then(() => true, () => false)) return binary;
  const base = `https://nodejs.org/dist/${process.version}`;
  console.log(`[mak] ${process.execPath} is not self-contained; downloading ${name} from nodejs.org`);
  const sums = await (await fetch(`${base}/SHASUMS256.txt`)).text();
  const expected = sums.split('\n').find(line => line.endsWith(`  ${name}.tar.gz`))?.split(/\s+/)[0];
  if (!expected) throw new Error(`nodejs.org lists no ${name}.tar.gz`);
  const response = await fetch(`${base}/${name}.tar.gz`);
  if (!response.ok) throw new Error(`Node download failed: HTTP ${response.status}`);
  const archive = Buffer.from(await response.arrayBuffer());
  const { createHash } = await import('node:crypto');
  if (createHash('sha256').update(archive).digest('hex') !== expected) throw new Error(`Checksum mismatch for ${name}.tar.gz`);
  await mkdir(cache, { recursive: true });
  await writeFile(path.join(cache, `${name}.tar.gz`), archive);
  const extracted = spawnSync('tar', ['-xzf', path.join(cache, `${name}.tar.gz`), '-C', cache, `${name}/bin/node`], { stdio: 'inherit' });
  if (extracted.status !== 0) throw new Error(`Could not extract ${name}`);
  await rm(path.join(cache, `${name}.tar.gz`));
  return binary;
}
const bundledNode = path.join(runtime, process.platform === 'win32' ? 'node.exe' : 'node');
await cp(await portableNode(), bundledNode);
// Package-manager installs can be read-only; the bundler must be able to replace the copy on the next build.
if (process.platform !== 'win32') { const { chmod } = await import('node:fs/promises'); await chmod(bundledNode, 0o755); }
await mkdir(path.join(runtime, 'service'), { recursive: true });
const serviceSource = path.join(repo, 'desktop', 'service');
await cp(serviceSource, path.join(runtime, 'service'), { recursive: true, filter: source => !path.relative(serviceSource, source).split(path.sep).some(part => ['node_modules', 'test', '.cache'].includes(part)) });
// A checkout can itself live under a cache/worktree directory. Validate the
// payload before npm can resolve an unrelated parent package.json.
for (const file of ['package.json', 'package-lock.json', 'main.mjs', 'server.mjs']) await access(path.join(runtime, 'service', file));
run(['ci', '--omit=dev'], path.join(runtime, 'service'));
// npm can unpack node-pty's macOS spawn-helper without the execute bit; terminals then fail with posix_spawnp.
if (process.platform === 'darwin') {
  const { chmod, readdir } = await import('node:fs/promises');
  const prebuilds = path.join(runtime, 'service', 'node_modules', 'node-pty', 'prebuilds');
  for (const dir of (await readdir(prebuilds).catch(() => [])).filter(name => name.startsWith('darwin-'))) {
    await chmod(path.join(prebuilds, dir, 'spawn-helper'), 0o755).catch(() => {});
  }
}
await cp(path.join(repo, 'dist'), path.join(runtime, 'ui'), { recursive: true });
// Vite deliberately does not copy the enormous workspace junction. Bundle only UI assets.
try { await access(path.join(repo, 'public', 'assets')); await cp(path.join(repo, 'public', 'assets'), path.join(runtime, 'ui', 'assets'), { recursive: true }); } catch { /* Optional brand assets. */ }
await writeFile(path.join(runtime, 'README.txt'), `Mr. Mak local runtime for ${process.platform}. User repositories, keys and CLI logins are not included.\n`);
const licenseCandidates = [
  path.join(path.dirname(process.execPath), 'LICENSE'),
  path.join(path.dirname(path.dirname(process.execPath)), 'LICENSE'),
  '/usr/share/licenses/nodejs-libs/LICENSE',
];
let license;
for (const nodeLicense of licenseCandidates) {
  try { license = await readFile(nodeLicense); break; } catch { /* Try the next installation layout. */ }
}
if (!license) {
  const response = await fetch(`https://raw.githubusercontent.com/nodejs/node/${process.version}/LICENSE`);
  if (!response.ok) throw new Error('Could not retrieve the license for the bundled Node runtime');
  license = await response.text();
}
await writeFile(path.join(runtime, 'NODE-LICENSE.txt'), license);
console.log('Desktop runtime prepared: Node, native terminals and production UI.');

// npm can unpack node-pty's macOS spawn-helper without the execute bit, and
// every terminal then fails with "posix_spawnp failed". Runs after install.
import { chmod, readdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.platform === 'darwin') {
  const prebuilds = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'desktop', 'service', 'node_modules', 'node-pty', 'prebuilds')
  for (const dir of (await readdir(prebuilds).catch(() => [])).filter(name => name.startsWith('darwin-'))) {
    await chmod(join(prebuilds, dir, 'spawn-helper'), 0o755).catch(() => {})
  }
}

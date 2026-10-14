// Ensures public/workspace points at ../workspace so the dev server can
// serve workspace.json and report files. The link is a junction on Windows
// (no admin rights needed) and a directory symlink elsewhere.
// Runs automatically before `npm run dev` (see "predev" in package.json).
import { existsSync, mkdirSync, symlinkSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const target = resolve(root, 'workspace')
const link = resolve(root, 'public', 'workspace')

if (!existsSync(target)) mkdirSync(target, { recursive: true })

if (!existsSync(link)) {
  try {
    symlinkSync(target, link, 'junction')
    console.log('[mak] linked public/workspace -> workspace')
  } catch (err) {
    console.warn(`[mak] could not create public/workspace link: ${err.message}`)
    console.warn('[mak] reports will 404 until the link exists')
  }
}

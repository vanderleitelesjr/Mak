// Run this with the packaged Node executable, not the runner's system Node.
import { createRequire } from 'node:module';
import path from 'node:path';
import assert from 'node:assert/strict';
const runtime = path.dirname(process.execPath);
const require = createRequire(path.join(runtime, 'service/package.json'));
const pty = require('node-pty');
const command = process.platform === 'win32' ? process.env.ComSpec : '/bin/sh';
const args = process.platform === 'win32' ? ['/c', 'echo mrmak-pty-ready'] : ['-c', 'printf mrmak-pty-ready'];
await new Promise((resolve, reject) => {
  const child = pty.spawn(command, args, { cwd: runtime, env: process.env });
  let output = '';
  const timer = setTimeout(() => { child.kill(); reject(Error('Bundled PTY did not finish')); }, 10000);
  child.onData(data => { output += data; });
  child.onExit(({ exitCode }) => {
    clearTimeout(timer);
    try { assert.equal(exitCode, 0); assert.match(output, /mrmak-pty-ready/); resolve(); } catch (error) { reject(error); }
  });
});
console.log(`Packaged Node ${process.version} and native PTY launch passed.`);

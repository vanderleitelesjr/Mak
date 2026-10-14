// Explicit smoke test against the installed, signed-in Codex CLI. No files are edited.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createService } from './server.mjs';
import { sleep } from './util.mjs';

if (!process.argv.includes('--use-subscription')) throw new Error('Pass --use-subscription to run small Codex turns before and after resume.');
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const service = await createService({ repo, uiDir: path.join(repo, 'dist'), stateDir: path.join(repo, '.cache', `native-smoke-${Date.now()}`) });
let complete = false;
service.sessions.on('notice', notice => { if (notice.kind === 'turn-completed') complete = true; });
try {
  const chat = await service.sessions.create({ agent: 'codex', name: 'Native connectivity check', bypass: true, cwd: repo });
  // A second Codex chat in the same folder must not make session discovery ambiguous.
  await service.sessions.create({ agent: 'codex', name: 'Parallel idle chat', bypass: true, cwd: repo });
  let ready = false;
  for (let index = 0; index < 30; index++) {
    const { screen } = await service.sessions.read(chat.id);
    if (screen.includes('›') && screen.includes('gpt-')) { ready = true; break; }
    await sleep(500);
  }
  if (!ready) throw new Error('Codex did not reach its prompt');
  service.sessions.input(chat.id, 'This is a terminal connectivity check. Reply with exactly MRMAK_TERMINAL_OK. Do not use tools or change any files.', { coordinator: true, submit: true });
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline && !complete) await sleep(500);
  const current = await service.sessions.read(chat.id);
  if (!complete || !current.nativeId) throw new Error('The initial native turn was not identified and completed');
  service.sessions.stop(chat.id);
  for (let index = 0; index < 50 && service.sessions.get(chat.id).process; index++) await sleep(100);
  if (service.sessions.get(chat.id).process) throw new Error('The initial terminal did not stop');
  service.sessions.get(chat.id).terminal.reset();
  complete = false;
  await service.sessions.resume(chat.id);
  let resumeReady = false;
  for (let index = 0; index < 40; index++) {
    const state = service.sessions.get(chat.id);
    const { screen } = await service.sessions.read(chat.id);
    if (state.stopNativeWatch && screen.includes('›') && screen.includes('gpt-')) { resumeReady = true; break; }
    await sleep(500);
  }
  if (!resumeReady) throw new Error('The resumed terminal or completion watcher did not become ready');
  service.sessions.input(chat.id, 'Reply with exactly MRMAK_RESUME_OK. Do not use tools or change any files.', { coordinator: true, submit: true });
  const resumedDeadline = Date.now() + 120000;
  while (Date.now() < resumedDeadline && !complete) await sleep(500);
  const resumed = await service.sessions.read(chat.id);
  console.log(JSON.stringify({ ready, nativeSessionIdentified: !!current.nativeId, turnCompleted: true, responseVisible: current.screen.includes('MRMAK_TERMINAL_OK'), resumedSameSession: resumed.nativeId === current.nativeId, resumedTurnCompleted: complete, resumedResponseVisible: resumed.screen.includes('MRMAK_RESUME_OK') }));
  if (!complete || !resumed.screen.includes('MRMAK_RESUME_OK')) process.exitCode = 1;
} finally { await service.close(); }

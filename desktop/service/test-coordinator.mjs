// Explicit integration check against the user's signed-in Codex subscription.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createService } from './server.mjs';

if (!process.argv.includes('--use-subscription')) throw new Error('Pass --use-subscription to run a small coordinator turn.');
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const service = await createService({ repo, uiDir: path.join(repo, 'dist'), stateDir: path.join(repo, '.cache', `coordinator-smoke-${Date.now()}`) });
const calls = [];
const execute = service.coordinator.execute;
service.coordinator.execute = async (name, args, id) => { calls.push(name); return execute(name, args, id); };
try {
  const record = await service.sessions.importConversation({ agent: 'codex', nativeId: '00000000-0000-0000-0000-000000000001', name: 'Coordinator integration check', cwd: repo });
  const result = await service.coordinator.ask({
    id: `check-${Date.now()}`,
    text: 'Integration check. Find the History conversation named Coordinator integration check and pin it. Do not reopen it or send it a message. Find the installed Blender animation skill and read its instructions. Read the actual app model, effort and voice settings. Reply in one short sentence with those settings and whether the two checks succeeded. Do not edit files or open other chats.',
  });
  assert.equal(result.status, 'completed', result.result);
  assert.equal(service.sessions.get(record.id).pinned, true);
  assert.equal(service.sessions.get(record.id).open, false);
  for (const name of ['search_history', 'pin_chat', 'list_skills', 'read_context', 'get_app_settings']) assert.ok(calls.includes(name), `Missing ${name}`);
  console.log(JSON.stringify({ model: service.coordinator.model, completed: true, tools: calls, result: result.result }));
} finally { await service.close(); }

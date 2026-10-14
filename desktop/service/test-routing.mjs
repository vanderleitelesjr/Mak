// Small real coordinator turns; every application action uses isolated test records.
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Coordinator } from './coordinator.mjs';
import { taskEffort } from './effort.mjs';
import { taskTitle } from './titles.mjs';

if (!process.argv.includes('--use-subscription')) throw new Error('Pass --use-subscription to check routing with the signed-in Codex account.');
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
await mkdir(path.join(repo, '.cache'), { recursive: true });
const stateDir = await mkdtemp(path.join(repo, '.cache', 'routing-smoke-'));
const calls = [], chats = [];
const card = { id: 'routing-check', title: 'Animation Review', description: 'The animation export was checked.', status: 'active', created: '2026-09-10', updated: '2026-09-10', steps: [] };
const coordinator = await new Coordinator({
  repo, stateDir,
  orientation: () => readFile(path.join(repo, 'desktop', 'coordinator.md'), 'utf8'),
  context: () => ({ localDate: '2026-09-12', chats, workspaceRoute: '#/routing-check' }),
  execute: async (name, args, id) => {
    calls.push({ name, args });
    switch (name) {
      case 'list_chats': return chats;
      case 'search_history': case 'search_context': case 'list_skills': return [];
      case 'list_workspace': return [card];
      case 'read_workspace': return { ...card, text: card.description };
      case 'workspace_activity': return { date: args.date, cards: [card], commits: ['Check animation export'], basis: 'Workspace dates and recorded Git changes.' };
      case 'update_workspace': assert.equal(args.entityId, card.id); Object.assign(card, args); return card;
      case 'open_chat': {
        const chat = { id: `test-chat-${chats.length}`, name: taskTitle(args.name), agent: args.agent, effort: taskEffort(coordinator.operations.get(id).text, args.effort), open: true, status: 'starting' };
        chats.push(chat); return chat;
      }
      case 'read_chat': return { ...chats.find(chat => chat.id === args.id), screen: 'Sign in required. This isolated test terminal is not authenticated.' };
      case 'focus_chat': case 'show_workspace': return { shown: true };
      default: throw new Error(`This isolated check does not allow ${name}.`);
    }
  },
}).init();
try {
  for (const [id, text] of [
    ['history', 'Напомни, чем мы занимались десятого сентября 2026 года, и поставь карточке Animation Review статус готово. Коротко.'],
    ['research', 'Создай новый Codex чат для глубокого исследования способов анимации игровых персонажей. Результат потом нужен в виде research карточки. Пока только открой чат, задачу не отправляй.'],
    ['max', 'Открой отдельный новый Claude чат для исследования физики ткани. Для этой задачи я явно прошу max effort. Пока только открой чат, ничего в него не отправляй.'],
  ]) {
    const before = calls.length, start = performance.now();
    const result = await coordinator.ask({ id, text });
    assert.equal(result.status, 'completed', result.result);
    const used = calls.slice(before);
    if (id === 'history') {
      assert.equal(chats.length, 0); assert.equal(card.status, 'done');
      assert.ok(used.some(call => call.name === 'workspace_activity' && call.args.date === '2026-09-10'));
    } else {
      const chat = chats.at(-1);
      assert.equal(chat?.agent, id === 'research' ? 'codex' : 'claude');
      assert.equal(chat?.effort, id === 'research' ? 'xhigh' : 'max');
    }
    console.log(JSON.stringify({ check: id, milliseconds: Math.round(performance.now() - start), tools: used.map(call => call.name), chat: id === 'history' ? null : chats.at(-1), result: result.result }));
  }
} finally { coordinator.close(); }

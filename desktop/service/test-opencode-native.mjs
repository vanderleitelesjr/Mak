// Opt-in integration test: real OpenCode, isolated home, loopback model fixture.
// No provider credentials, paid model calls, user chats or global config changes.
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { opencodeEnvironment, readOpencodeState } from './opencode.mjs';
import { Sessions } from './sessions.mjs';

const binary = process.argv[process.argv.indexOf('--binary') + 1];
if (!process.argv.includes('--binary') || !path.isAbsolute(binary)) throw new Error('Pass --binary with an absolute path to the OpenCode executable. This test never installs a CLI.');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
await mkdir(path.join(root, '.cache'), { recursive: true });
const repo = await mkdtemp(path.join(root, '.cache/opencode-native-'));
for (const folder of ['data', 'config', 'cache', 'state', 'temp', 'project']) await mkdir(path.join(repo, folder));
const env = Object.fromEntries(['SystemRoot', 'WINDIR', 'ComSpec', 'PATH', 'PATHEXT'].filter(k => process.env[k]).map(k => [k, process.env[k]]));
Object.assign(env, {
  HOME: repo, USERPROFILE: repo, APPDATA: path.join(repo, 'config'), LOCALAPPDATA: path.join(repo, 'data'),
  TEMP: path.join(repo, 'temp'), TMP: path.join(repo, 'temp'),
  XDG_DATA_HOME: path.join(repo, 'data'), XDG_CONFIG_HOME: path.join(repo, 'config'),
  XDG_CACHE_HOME: path.join(repo, 'cache'), XDG_STATE_HOME: path.join(repo, 'state'),
  OPENCODE_DISABLE_AUTOUPDATE: '1', OPENCODE_DISABLE_MODELS_FETCH: '1', OPENCODE_DISABLE_PROJECT_CONFIG: '1', NO_COLOR: '1',
});
const version = execFileSync(binary, ['--version'], { env, encoding: 'utf8', windowsHide: true }).trim();
const major = Number(/(?:^|\s)v?(\d+)\./.exec(version)?.[1]);
assert.ok([1, 2].includes(major), version);
const requests = [];
const server = http.createServer(async (req, res) => {
  let raw = ''; for await (const chunk of req) raw += chunk;
  const data = raw ? JSON.parse(raw) : {};
  requests.push(data);
  const answer = 'MRMAK_LOOPBACK_ANSWER';
  if (data.stream) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    const chunk = (delta, finish_reason = null) => ({ id: 'chatcmpl_fixture', object: 'chat.completion.chunk', created: 1, model: 'local', choices: [{ index: 0, delta, finish_reason }] });
    res.write(`data: ${JSON.stringify(chunk({ role: 'assistant', content: answer }))}\n\n`);
    res.write(`data: ${JSON.stringify(chunk({}, 'stop'))}\n\n`);
    res.end('data: [DONE]\n\n');
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id: 'chatcmpl_fixture', object: 'chat.completion', created: 1, model: 'local', choices: [{ index: 0, message: { role: 'assistant', content: answer }, finish_reason: 'stop' }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }));
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const baseURL = `http://127.0.0.1:${server.address().port}/v1`;
env.OPENCODE_CONFIG_CONTENT = JSON.stringify(major === 1 ? {
  model: 'fixture/local', small_model: 'fixture/local', share: 'disabled',
  provider: { fixture: { npm: '@ai-sdk/openai-compatible', name: 'Local fixture', options: { baseURL, apiKey: 'fixture-only' }, models: { local: { name: 'Local fixture', limit: { context: 32000, output: 1024 } } } } },
} : {
  model: 'fixture/local', share: 'disabled', update: 'disable', warming: false,
  providers: { fixture: { package: '@opencode/ai/providers/openai-compatible', settings: { baseURL, apiKey: 'fixture-only' }, models: { local: { name: 'Local fixture', limit: { context: 32000, output: 1024 } } } } },
});

async function run(chatId, nativeId, prompt) {
  const childEnv = opencodeEnvironment(env, { stateDir: repo, session: { id: chatId, nativeId }, major });
  const args = ['run', ...(major === 2 ? ['--standalone'] : []), '--format', 'json', '--model', 'fixture/local', '--title', 'Isolated fixture', ...(nativeId ? ['--session', nativeId] : []), prompt];
  const proc = spawn(binary, args, { cwd: path.join(repo, 'project'), env: childEnv, windowsHide: true });
  proc.stdin.end();
  let output = '';
  proc.stdout.on('data', x => { output += x; }); proc.stderr.on('data', x => { output += x; });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; proc.kill(); }, 90000);
  const code = await new Promise((resolve, reject) => { proc.on('error', reject); proc.on('exit', resolve); });
  clearTimeout(timer);
  await writeFile(path.join(repo, `${chatId}-${nativeId ? 'resume' : 'first'}.log`), output);
  assert.equal(timedOut, false, `CLI timeout. Logs: ${repo}`);
  assert.equal(code, 0, `CLI failed (${version}). Logs: ${repo}\n${output.slice(-2000)}`);
  const state = await readOpencodeState(repo, chatId);
  assert.ok(state?.nativeId && state.completion, `Observer must record the real session and completed turn. Logs: ${repo}`);
  assert.equal(state.launchId, childEnv.MRMAK_OPENCODE_LAUNCH_ID);
  assert.equal(state.activity, 'idle');
  assert.ok(output.includes('MRMAK_LOOPBACK_ANSWER'));
  return state;
}
try {
  const first = await run('chat-a', null, 'FIRST_CONTEXT_SENTINEL');
  const other = await run('chat-b', null, 'OTHER_CONTEXT_SENTINEL');
  assert.notEqual(first.nativeId, other.nativeId);
  requests.length = 0;
  const resumed = await run('chat-a', first.nativeId, 'SECOND_CONTEXT_SENTINEL');
  assert.equal(resumed.nativeId, first.nativeId);
  assert.notEqual(resumed.completion, first.completion);
  assert.ok(requests.some(r => JSON.stringify(r).includes('FIRST_CONTEXT_SENTINEL')), 'Native resume must send the original context');
  assert.ok(requests.every(r => !JSON.stringify(r).includes('OTHER_CONTEXT_SENTINEL')), 'Other chat context must remain separate');
  const record = await readFile(path.join(repo, 'opencode-chat-a.json'), 'utf8');
  assert.ok(!record.includes('CONTEXT_SENTINEL') && !record.includes('fixture-only'));
  if (process.argv.includes('--tui')) {
    const previousEnv = process.env;
    process.env = { ...env, PATH: path.dirname(binary) + path.delimiter + env.PATH };
    const sessions = await new Sessions(path.join(repo, 'project'), path.join(repo, 'state')).init();
    try {
      const chat = await sessions.create({ agent: 'opencode', name: 'Native Terminal Check', cols: 100, rows: 32 });
      async function until(check, description, timeout = 45000) {
        const deadline = Date.now() + timeout;
        while (!await check()) {
          if (Date.now() > deadline) {
            await writeFile(path.join(repo, 'tui-screen.log'), (await sessions.read(chat.id, 150)).screen);
            throw new Error(`${description}. Screen: ${repo}/tui-screen.log`);
          }
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
      const ready = async () => /Ask anything|Ask a question|Build anything|What would|Type a message|Build.*Local fixture/i.test((await sessions.read(chat.id)).screen);
      await until(ready, 'TUI did not reach its prompt');
      sessions.input(chat.id, 'TUI_FIRST_SENTINEL', { coordinator: true, submit: true });
      await until(() => sessions.get(chat.id).completionVersion === 1, 'TUI turn did not complete');
      const id = sessions.get(chat.id).nativeId;
      assert.ok(id);
      await sessions.remove(chat.id);
      sessions.get(chat.id).terminal.reset();
      await sessions.resume(chat.id);
      await until(ready, 'Resumed TUI did not reach its prompt');
      sessions.input(chat.id, 'TUI_SECOND_SENTINEL', { coordinator: true, submit: true });
      await until(() => sessions.get(chat.id).completionVersion === 2, 'Resumed TUI turn did not complete');
      assert.equal(sessions.get(chat.id).nativeId, id);
      assert.ok(requests.some(r => { const text = JSON.stringify(r); return text.includes('TUI_FIRST_SENTINEL') && text.includes('TUI_SECOND_SENTINEL'); }));
      await sessions.remove(chat.id);
    } finally { await sessions.close(); process.env = previousEnv; }
  }
  console.log(JSON.stringify({ version, nativeSession: true, completion: true, resumedSameContext: true, otherChatIsolated: true, tui: process.argv.includes('--tui'), paidCalls: 0, logs: repo }));
} finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }

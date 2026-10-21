import test from 'node:test';
import assert from 'node:assert/strict';
import { answerPrompt, readPrompt, terminalPrompt } from '../terminal-prompt.mjs';

function fixture() {
  const state = { command: 'echo first', selected: 0, visible: true, process: {}, writes: [], afterKey: null };
  const screen = () => state.visible ? ['Allow command?', `$ ${state.command}`, '', ...['Yes, proceed', 'Yes, always', 'No'].map((label, i) => `${i === state.selected ? '>' : ' '} ${i + 1}. ${label}`), 'Press enter to confirm'].join('\n') : 'Working...';
  const sessions = { get: () => ({ process: state.process }), read: async () => ({ screen: screen() }), keys: (_, data) => {
    state.writes.push(data);
    if (data === '\x1b[B') state.selected++;
    if (data === '\x1b[A') state.selected--;
    state.afterKey?.(data);
  } };
  return { state, sessions, screen };
}

test('changing a command invalidates the displayed approval, including long wrapped details', async () => {
  const { state, sessions, screen } = fixture();
  state.command = Array.from({ length: 10 }, (_, i) => `line ${i}`).join('\n') + '\necho first';
  const fingerprint = terminalPrompt(screen()).id;
  const prompt = await readPrompt(sessions, 'chat');
  state.command = state.command.replace('echo first', 'echo second');
  assert.notEqual(terminalPrompt(screen()).id, fingerprint);
  await assert.rejects(answerPrompt(sessions, 'chat', prompt.id, 0), error => error.status === 409);
  assert.deepEqual(state.writes, []);
});

test('approval revalidates the command after moving the menu selection', async () => {
  const { state, sessions } = fixture();
  const prompt = await readPrompt(sessions, 'chat');
  state.afterKey = () => { state.command = 'echo replacement'; };
  await assert.rejects(answerPrompt(sessions, 'chat', prompt.id, 1), error => error.status === 409);
  assert.deepEqual(state.writes, ['\x1b[B']);
});

test('a simultaneous or repeated approval cannot submit twice', async () => {
  const { state, sessions } = fixture();
  const prompt = await readPrompt(sessions, 'chat');
  const first = answerPrompt(sessions, 'chat', prompt.id, 0);
  await assert.rejects(answerPrompt(sessions, 'chat', prompt.id, 0), error => error.status === 409);
  await first;
  await assert.rejects(answerPrompt(sessions, 'chat', prompt.id, 0), error => error.status === 409);
  assert.equal(await readPrompt(sessions, 'chat'), null);
  assert.deepEqual(state.writes, ['\r']);
});

test('a returned identical prompt or restarted process needs a new approval', async () => {
  const { state, sessions } = fixture();
  const first = await readPrompt(sessions, 'chat');
  state.visible = false; assert.equal(await readPrompt(sessions, 'chat'), null);
  state.visible = true; const second = await readPrompt(sessions, 'chat');
  assert.notEqual(second.id, first.id);
  await assert.rejects(answerPrompt(sessions, 'chat', first.id, 0), error => error.status === 409);
  state.process = {};
  await assert.rejects(answerPrompt(sessions, 'chat', second.id, 0), error => error.status === 409);
  assert.deepEqual(state.writes, []);
});

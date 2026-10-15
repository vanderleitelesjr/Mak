// README screenshots of the Chats window and the phone, made only from fictional
// fixtures. Every folder, chat and CLI transcript lives in a temporary folder under
// .cache/ that is removed at the end; HOME, USERPROFILE, CLAUDE_CONFIG_DIR and
// CODEX_HOME point into it, and the CLI processes are stubs. Paths shown in the UI
// are rewritten from the temporary folder to D:\ so no local path appears.
//
//   npm run build && node scripts/readme-screenshots.mjs
//
// Output: docs/assets/{conversation-view,conversation-permission,new-chat-projects,
// handoff-offer,tabs-by-project,mobile-terminal-wrap}.png
// MRMAK_SHOT_SCALE=1 renders at 1x instead of 2x.
import http from 'node:http';
import { copyFile, cp, mkdir, mkdtemp, realpath, rm, stat, utimes, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'docs', 'assets');
const scale = Number(process.env.MRMAK_SHOT_SCALE) || 2;
await stat(path.join(root, 'dist', 'index.html')).catch(() => { throw new Error('Run npm run build first: dist/ is missing.'); });
await mkdir(path.join(root, '.cache'), { recursive: true });
const base = await realpath(await mkdtemp(path.join(root, '.cache', 'readme-shots-')));
const home = path.join(base, 'home');
const folder = (...parts) => path.join(base, ...parts);
const repo = folder('Work', 'mr-mak');
const projects = {
  dream: folder('Games', 'dream-game'), arachne: folder('Games', 'arachne-lab'), tide: folder('Games', 'tide-runner'),
  pixel: folder('Games', 'pixel-forge'), studio: folder('Work', 'studio-site'),
};

// Point every home-dependent reader at the fixture before the service loads.
const envNames = ['HOME', 'USERPROFILE', 'CLAUDE_CONFIG_DIR', 'CODEX_HOME'];
const priorEnv = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
Object.assign(process.env, { HOME: home, USERPROFILE: home, CLAUDE_CONFIG_DIR: path.join(home, '.claude'), CODEX_HOME: path.join(home, '.codex') });

// Shown paths: the temporary folder becomes D:, in raw, JSON-escaped and slash forms.
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hidden = [base, base.replaceAll('\\', '\\\\'), base.replaceAll('\\', '/')].map(form => new RegExp(escape(form), 'gi'));
const disguise = text => hidden.reduce((value, pattern) => value.replace(pattern, 'D:'), text);

const day = '2026-10-15';
const at = (clock) => new Date(`${day}T${clock}:00Z`).toISOString();
let uuidCounter = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++uuidCounter).padStart(12, '0')}`;

// Claude Code transcript records: plain user prompts and assistant text parts.
function claudeRecords(turns) {
  return turns.map(([role, clock, text, extra]) => role === 'user'
    ? { type: 'user', uuid: uuid(), timestamp: at(clock), message: { role: 'user', content: text } }
    : { type: 'assistant', uuid: uuid(), timestamp: at(clock), message: { id: `msg_${uuid()}`, role: 'assistant', content: [{ type: 'text', text }, ...(extra || [])] } });
}

const combatTurns = [
  ['user', '09:12', 'The parry feels too strict on controller. Can you check the combat timings in Dream Game?'],
  ['assistant', '09:13', [
    'The parry window is **120 ms**, about 7 frames at 60 fps. Controller input adds roughly 30 ms of latency, so players on a gamepad get closer to 5 usable frames.',
    '',
    '| Action | Window | Recovery |',
    '| --- | --- | --- |',
    '| Parry | 120 ms | 400 ms |',
    '| Perfect parry | first 60 ms | 250 ms |',
    '| Dodge | 180 ms | 350 ms |',
    '',
    'Suggestion: widen `PARRY_WINDOW_MS` to **160 ms**, keep the perfect-parry bonus at the first 60 ms, and buffer a parry press for 80 ms during hit-stop.',
  ].join('\n')],
  ['user', '09:15', 'Sounds good. Make the change and tell me what to test.'],
  ['assistant', '09:18', [
    'Done. `src/combat/combat.ts` now uses a **160 ms** parry window with an 80 ms input buffer. Please test:',
    '',
    '1. Parry the *Warden* combo on a gamepad, then on keyboard.',
    '2. Mash parry during hit-stop: only one parry should come out.',
  ].join('\n')],
];

const parryTurns = [
  ['user', '10:02', 'Widen the parry window to 160 ms in combat.ts, keep the perfect-parry bonus at the first 60 ms.'],
  ['assistant', '10:03', 'I will change `PARRY_WINDOW_MS` in `src/combat/combat.ts` from 120 to 160 and leave `PERFECT_PARRY_MS` at 60.', [{ type: 'tool_use', id: 'toolu_parry_edit', name: 'Edit', input: {} }]],
];

const bossTopics = [
  'Lower the Warden phase-two health by 10%.', 'Make the slam telegraph 0.2 s longer.', 'Add a checkpoint before the arena door.',
  'Reduce add spawns on easy difficulty.', 'Give the shockwave a visible ring.', 'Swap the enrage timer for a health trigger.',
  'Tune the stagger meter so it fills in three combos.', 'Shorten the intro cutscene skip delay.',
];
const bossTurns = [];
for (let index = 0; index < 38; index++) {
  const minute = String(10 + Math.floor(index / 2)).padStart(2, '0');
  bossTurns.push(['user', `11:${minute}`, `${bossTopics[index % bossTopics.length]} (pass ${Math.floor(index / bossTopics.length) + 1})`]);
  bossTurns.push(['assistant', `11:${minute}`, `Updated \`boss/warden.json\` for that change and re-ran the arena simulation: average fight length is now ${(4.6 - index * 0.01).toFixed(2)} minutes.`]);
}
bossTurns.push(
  ['user', '12:31', 'How does the fight compare with the target now?'],
  ['assistant', '12:32', 'The Warden now averages **4.2 minutes** against a 4-minute target, and the first-try clear rate in the simulation rose from 18% to 31%. Phase two is still where most attempts end.'],
  ['user', '12:34', 'Keep phase two hard but make the slam easier to read.'],
  ['assistant', '12:36', 'The slam now has a dust burst 0.3 s before impact and a louder wind-up roar. Damage is unchanged, so phase two keeps its difficulty while the attack is easier to read.'],
  ['user', '12:38', 'Great. Note the remaining ideas for the next session.'],
  ['assistant', '12:39', [
    'Remaining ideas for the Warden:',
    '',
    '- Try a second slam variant that sweeps left to right.',
    '- Record new roar lines with the audio team.',
    '- Re-check the checkpoint placement after the arena art pass.',
  ].join('\n')],
);

const walkTurns = [
  ['user', '08:40', 'The spider still slides its feet on the ramp at sprint speed. Can you fix the walk cycle?'],
  ['assistant', '08:52', 'Fixed: the front-left leg now lifts 0.03 s earlier at sprint speed. All 12 walk-cycle checks pass.'],
];
const releaseTurns = [
  ['user', '14:05', 'Draft the release notes for version 0.9 from the merged changes.'],
  ['assistant', '14:07', 'Release notes for 0.9 are in `docs/releases/0.9.md`: Conversation view, recent projects in New chat and grouped tabs.'],
];

// Codex rollout: session metadata, then the visible user and agent messages.
const codexId = '0199c3f2-5a7b-7c41-9e2d-4b8f6a1c2d3e';
const codexRecords = [
  { type: 'session_meta', timestamp: at('13:20'), payload: { id: codexId, cwd: projects.arachne, source: 'cli', originator: 'codex_cli_rs' } },
  { type: 'event_msg', timestamp: at('13:20'), payload: { type: 'user_message', message: 'Make the web shader shimmer less at a distance.' } },
  { type: 'event_msg', timestamp: at('13:24'), payload: { type: 'agent_message', message: 'The web shader now fades its shimmer between 20 and 40 metres.' } },
];

const chats = [
  { key: 'combat', name: 'Combat tuning', agent: 'claude', cwd: projects.dream, turns: combatTurns, pinned: true, tabColor: '#dba3bb' },
  { key: 'parry', name: 'Parry edit', agent: 'claude', cwd: projects.dream, turns: parryTurns, tabColor: '#dba3bb' },
  { key: 'boss', name: 'Boss balance', agent: 'claude', cwd: projects.dream, turns: bossTurns },
  { key: 'walk', name: 'Walk cycle', agent: 'claude', cwd: projects.arachne, turns: walkTurns, tabColor: '#8cc8b4' },
  { key: 'shader', name: 'Web shader', agent: 'codex', cwd: projects.arachne, nativeId: codexId },
  { key: 'release', name: 'Release notes', agent: 'claude', cwd: repo, turns: releaseTurns, tabColor: '#91b6da' },
];

// What each stub CLI leaves on its terminal.
const crlf = lines => lines.join('\r\n') + '\r\n';
const box = (rows, width = 76) => [`╭${'─'.repeat(width)}╮`, ...rows.map(row => `│ ${row.padEnd(width - 2)} │`), `╰${'─'.repeat(width)}╯`];
const screens = {
  parry: crlf([
    '> Widen the parry window to 160 ms in combat.ts, keep the perfect-parry bonus at the',
    '  first 60 ms.',
    '',
    '● I will change PARRY_WINDOW_MS in src/combat/combat.ts from 120 to 160 and leave',
    '  PERFECT_PARRY_MS at 60.',
    '',
    '● Update(src/combat/combat.ts)',
    ...box([
      'Edit file',
      '',
      '  src/combat/combat.ts',
      '  - export const PARRY_WINDOW_MS = 120;',
      '  + export const PARRY_WINDOW_MS = 160;',
      '',
      'Do you want to make this edit to combat.ts?',
      '❯ 1. Yes',
      '  2. Yes, allow all edits during this session (shift+tab)',
      '  3. No, and tell Claude what to do differently (esc)',
    ]),
  ]),
  walk: crlf([
    '> The spider still slides its feet on the ramp at sprint speed. Can you fix the walk cycle?',
    '',
    '● Read(src/animation/spider-gait.ts)',
    '  ⎿  Read 214 lines',
    '',
    '● The sprint gait reuses the walk phase offsets, so the front-left leg lands 0.03 s late on slopes steeper than 20 degrees and the IK solver drags it back into place.',
    '',
    '● Update(src/animation/spider-gait.ts)',
    '  ⎿  Updated src/animation/spider-gait.ts with 6 additions and 2 removals',
    '',
    '● Bash(npm run test:anim -- --filter spider)',
    '  ⎿  > arachne-lab@0.4.0 test:anim',
    '     > vitest run tests/animation --filter spider',
    '',
    '      ✓ spider-gait > leg phase offsets stay within 0.02 of the tetrapod pattern at every speed step',
    '      ✓ spider-gait > no foot slides more than 1 cm on the 25 degree ramp at sprint speed',
    '      ✓ spider-gait > idle to walk blend keeps its 0.25 s duration and never pops a leg',
    '      ✓ spider-ik > knees bend outward on uneven ground and stay clear of the body mesh',
    '',
    '      Test Files  3 passed (3)',
    '           Tests  12 passed (12)',
    '',
    '● Fixed. The front-left leg now lifts 0.03 s earlier at sprint speed, which removes the foot slide on the ramp; the idle-to-walk blend is unchanged. All 12 walk-cycle checks pass.',
    '',
  ]),
};
const defaultScreen = name => crlf([`Resumed "${name}".`, '', '> Ready for your next message.']);

let service, browser, qrSource;
try {
  // Folders, Claude Code config and transcripts.
  for (const item of [repo, ...Object.values(projects)]) await mkdir(item, { recursive: true });
  await mkdir(path.join(repo, 'workspace'), { recursive: true });
  await writeFile(path.join(repo, 'workspace', 'workspace.json'), '{"entities":[]}');
  const claudeDir = path.join(home, '.claude');
  await mkdir(path.join(claudeDir, 'projects'), { recursive: true });
  await writeFile(path.join(claudeDir, '.claude.json'), JSON.stringify({ projects: Object.fromEntries(Object.values(projects).map(item => [item.replaceAll('\\', '/'), { allowedTools: [] }])) }));
  const transcriptDir = cwd => path.join(claudeDir, 'projects', cwd.replace(/[^a-zA-Z0-9]/g, '-'));
  for (const item of Object.values(projects)) await mkdir(transcriptDir(item), { recursive: true });
  const sessions = [];
  for (const [index, chat] of chats.entries()) {
    const nativeId = chat.nativeId || uuid();
    if (chat.agent === 'claude') await mkdir(transcriptDir(chat.cwd), { recursive: true });
    if (chat.agent === 'claude') await writeFile(path.join(transcriptDir(chat.cwd), `${nativeId}.jsonl`), claudeRecords(chat.turns).map(record => JSON.stringify(record)).join('\n') + '\n');
    chat.id = `readme-${chat.key}`;
    sessions.push({ id: chat.id, name: chat.name, agent: chat.agent, cwd: chat.cwd, nativeId, hasConversation: true, open: true, pinned: !!chat.pinned, tabOrder: index, tabColor: chat.tabColor || null, effort: chat.agent === 'claude' ? 'high' : 'medium', bypass: false, createdAt: at('08:00'), updatedAt: at('08:00'), status: 'stopped', cols: 96, rows: 32 });
  }
  const codexDay = path.join(home, '.codex', 'sessions', '2026', '10', '15');
  await mkdir(codexDay, { recursive: true });
  await writeFile(path.join(codexDay, `rollout-2026-10-15T13-20-00-${codexId}.jsonl`), codexRecords.map(record => JSON.stringify(record)).join('\n') + '\n');
  // Recent-project order comes from the transcript folder dates.
  for (const [name, clock] of [['dream', '12:40'], ['arachne', '13:25'], ['tide', '11:00'], ['studio', '10:00'], ['pixel', '09:00']]) {
    const when = new Date(at(clock)); when.setDate(when.getDate() - (name === 'tide' ? 1 : name === 'studio' ? 2 : name === 'pixel' ? 5 : 0));
    await utimes(transcriptDir(projects[name]), when, when);
  }
  await mkdir(path.join(repo, '.mrmak'), { recursive: true });
  await writeFile(path.join(repo, '.mrmak', 'sessions.json'), JSON.stringify(sessions));
  await writeFile(path.join(repo, '.mrmak', 'settings.json'), JSON.stringify({ defaultAgent: 'claude', defaultBypass: false, groupTabsByProject: true, handoffAfter: 40, pinnedProjects: [projects.arachne], selectedId: 'readme-combat' }));

  // The phone app needs the PWA icons that the desktop build leaves out.
  const uiDir = folder('ui');
  await cp(path.join(root, 'dist'), uiDir, { recursive: true });
  for (const name of ['mak-nose.svg', 'mak-nose-chats.svg', 'mak-mobile-192.png', 'mak-mobile-512.png']) await copyFile(path.join(root, 'public', 'assets', name), path.join(uiDir, 'assets', name)).catch(() => {});

  const { createService } = await import('../desktop/service/server.mjs');
  const { MobileDictation } = await import('../desktop/service/mobile-dictation.mjs');
  const { launchBrowser } = await import('../desktop/service/test/browser.mjs');
  const transport = { probe: async () => ({ ready: true, installed: true }), enable: async origin => ({ origin }), disable: async () => {} };
  const readAloud = { status: async () => ({ available: true }), synthesize: async () => Buffer.from('RIFFfakeWAVE'), revoke() {}, close() {} };
  service = await createService({ repo, uiDir, mcpOptions: { home, env: {} }, mobileOptions: { transport, readAloud, dictation: new MobileDictation(repo, { env: {} }) } });
  service.sessions.beginDiscovery = () => {};
  // Stub CLIs: no process starts; each terminal shows its fixture screen.
  service.sessions.launch = async session => {
    const chat = chats.find(item => item.id === session.id);
    let onExit;
    session.process = { resize() {}, write() {}, onExit(callback) { onExit = callback; return { dispose() {} }; }, kill() { session.process = null; session.status = 'stopped'; onExit?.({ exitCode: 0 }); } };
    session.status = 'running'; session.activity = 'idle'; session.restoreError = null;
    await new Promise(resolve => session.terminal.write(screens[chat?.key] || defaultScreen(session.name), resolve));
    service.sessions.changed(session);
  };
  await service.sessions.restore();
  if (service.sessions.list().some(item => item.status !== 'running')) throw new Error(`A fixture chat did not start: ${JSON.stringify(service.sessions.list().map(item => [item.name, item.status, item.restoreError]))}`);

  // Edge needs the real profile folder to start; it still uses a temporary browser profile.
  const browserEnv = { ...process.env };
  for (const name of ['HOME', 'USERPROFILE']) if (priorEnv[name] === undefined) delete browserEnv[name]; else browserEnv[name] = priorEnv[name];
  browser = await launchBrowser({ env: browserEnv });
  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: scale, colorScheme: 'dark', locale: 'en-US', timezoneId: 'UTC' });
  // Show fixture folders as D:\… in API replies and service events.
  await desktopContext.route(url => new URL(url).pathname.startsWith('/api/'), async route => {
    const response = await route.fetch();
    if (!(response.headers()['content-type'] || '').includes('json')) return route.fulfill({ response });
    return route.fulfill({ response, body: disguise(await response.text()) });
  });
  await desktopContext.routeWebSocket(url => new URL(url).pathname === '/events', ws => {
    const server = ws.connectToServer();
    server.onMessage(message => ws.send(typeof message === 'string' ? disguise(message) : message));
    ws.onMessage(message => server.send(message));
  });
  const page = await desktopContext.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(service.urls.chats);
  await page.locator('.chat-tab').first().waitFor();
  const shot = async (name, options) => { const file = path.join(out, name); await (options.locator || page).screenshot({ path: file, animations: 'disabled', ...(options.clip ? { clip: options.clip } : {}) }); console.log(`Saved ${path.relative(root, file)}`); };
  const settle = async () => { await page.mouse.move(1270, 140); await page.waitForTimeout(700); };
  const openChat = async name => {
    await page.getByRole('tab', { name: new RegExp(`^${name} ·`) }).click();
    await page.locator('.chat-context .chat-view-toggle').waitFor();
  };

  // 1. Conversation view with Markdown and Read aloud.
  await openChat('Combat tuning');
  await page.getByRole('group', { name: 'Chat view' }).getByRole('button', { name: 'Conversation' }).click();
  await page.locator('.conversation-read-aloud').waitFor();
  await page.locator('.conversation-copy-text table').waitFor();
  await settle();
  await shot('conversation-view.png', {});

  // 2. A CLI permission menu rendered as buttons.
  await openChat('Parry edit');
  await page.locator('.conversation-prompt').waitFor();
  await page.getByRole('button', { name: /Yes, allow all edits/ }).waitFor();
  await settle();
  await shot('conversation-permission.png', {});

  // 4. Fresh-chat offer in a long chat.
  await openChat('Boss balance');
  await page.getByRole('button', { name: 'Summarize and continue' }).waitFor();
  await page.locator('.conversation-read-aloud').waitFor();
  await settle();
  await shot('handoff-offer.png', {});

  // 5. Tabs grouped by project: the top of the window.
  await openChat('Combat tuning');
  await page.locator('.chat-tab-group').nth(2).waitFor();
  await settle();
  const context = await page.locator('.chat-context').boundingBox();
  await shot('tabs-by-project.png', { clip: { x: 0, y: 0, width: 1280, height: Math.ceil(context.y + context.height) } });

  // 3. New chat with recent projects and a pinned favorite.
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.getByRole('button', { name: 'New chat', exact: true }).click();
  const dialog = page.locator('.desk-dialog');
  await dialog.locator('.project-row').nth(4).waitFor();
  await dialog.getByRole('radio', { name: /dream-game/ }).click();
  await dialog.getByPlaceholder('e.g. Dream Game · animations').fill('Dream Game · enemy waves');
  await page.waitForTimeout(500);
  await shot('new-chat-projects.png', { locator: dialog });
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1280, height: 860 });

  // 6. Phone Terminal in Wrap mode: pair a phone through the desktop dialog.
  await page.getByRole('button', { name: 'Mobile access', exact: true }).click();
  const pairingResponse = page.waitForResponse(response => response.url().endsWith('/api/mobile/pair') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Enable & show QR code' }).click();
  const pairing = await (await pairingResponse).json();
  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: scale, isMobile: true, hasTouch: true, colorScheme: 'dark', locale: 'en-US', timezoneId: 'UTC' });
  const phone = await phoneContext.newPage();
  phone.setDefaultTimeout(15000);
  phone.on('pageerror', error => errors.push(`phone: ${error.message}`));
  // Open the pairing link from another site, as a QR scanner does.
  qrSource = http.createServer((_request, response) => { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end(`<a href="${pairing.url}">Open Mr. Mak</a>`); });
  await new Promise(resolve => qrSource.listen(0, 'localhost', resolve));
  await phone.goto(`http://localhost:${qrSource.address().port}`);
  await phone.getByRole('link', { name: 'Open Mr. Mak' }).click();
  await phone.getByRole('button', { name: 'Request connection' }).click();
  await phone.getByRole('heading', { name: 'Confirm on your computer' }).waitFor();
  await page.getByRole('button', { name: 'Connect phone', exact: true }).click();
  await phone.getByRole('heading', { name: 'Chats', exact: true }).waitFor();
  await phone.getByRole('button', { name: /Walk cycle/ }).first().click();
  await phone.getByRole('group', { name: 'Conversation view' }).getByRole('button', { name: 'Terminal', exact: true }).click();
  await phone.locator('.mobile-terminal-reader pre').waitFor();
  await phone.waitForTimeout(800);
  await phone.screenshot({ path: path.join(out, 'mobile-terminal-wrap.png'), animations: 'disabled' });
  console.log('Saved docs/assets/mobile-terminal-wrap.png');

  if (errors.length) throw new Error(`Page errors:\n${errors.join('\n')}`);
} finally {
  await browser?.close().catch(() => {});
  await service?.close().catch(() => {});
  qrSource?.close();
  for (const [name, value] of Object.entries(priorEnv)) if (value === undefined) delete process.env[name]; else process.env[name] = value;
  await rm(base, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(error => console.warn(`Could not remove ${base}: ${error.message}`));
}

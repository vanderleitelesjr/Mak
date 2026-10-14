// Explicit, short paid connectivity test. Never runs as part of the test suite.
import { readFile } from 'node:fs/promises';
import { parse } from 'dotenv';
import { WebSocket } from 'ws';
import { voiceSession } from './voice-profile.mjs';

if (!process.argv.includes('--allow-paid')) throw new Error('Pass --allow-paid to run a short OpenAI Live connection test.');
const env = parse(await readFile(new URL('../../.env', import.meta.url), 'utf8'));
const key = env.OPENAI_API_KEY || env.OPENAI_KEY || process.env.OPENAI_API_KEY;
if (!key) throw new Error('No OpenAI key in repository .env');
const result = { started: false, audioBytes: 0, finalized: false, error: null };
const ws = new WebSocket('wss://api.openai.com/v1/live/sessions', { headers: { Authorization: `Bearer ${key}` } });
let closing = false;
let inputTimer;
const timer = setTimeout(() => { result.error ||= 'Timed out'; ws.terminate(); }, 25000);
const finish = () => { if (!closing && ws.readyState === WebSocket.OPEN) { closing = true; ws.send(JSON.stringify({ type: 'session.close' })); } };
ws.on('open', () => ws.send(JSON.stringify({ type: 'session.start', session: {
  ...voiceSession(),
  audio: { ...voiceSession().audio, format: { type: 'audio/pcm', rate: 24000 } },
} })));
ws.on('message', raw => {
  const event = JSON.parse(raw.toString());
  if (event.type === 'session.started') {
    result.started = true;
    inputTimer = setInterval(() => { if (ws.readyState === WebSocket.OPEN && !closing) ws.send(JSON.stringify({ type: 'session.input_audio.append', audio: Buffer.alloc(4800).toString('base64') })); }, 100);
    ws.send(JSON.stringify({ type: 'session.commentary.append', event_id: 'connection_test', delegation_id: null, content: 'The local connection is ready. Say: Mr. Mak is ready.' }));
    setTimeout(finish, 13000);
  }
  if (event.type === 'session.output_audio.delta') result.audioBytes += Buffer.from(event.delta, 'base64').length;
  if (event.type === 'session.closed') { result.finalized = true; ws.close(); }
  if (event.type === 'error' || event.type === 'session.error') { result.error = event.error?.message || event.message || event.type; finish(); }
});
ws.on('unexpected-response', (_request, response) => { result.error = `OpenAI handshake HTTP ${response.statusCode}`; response.resume(); ws.terminate(); });
ws.on('error', error => { result.error ||= error.message.replaceAll(key, '[redacted]'); });
ws.on('close', () => { clearTimeout(timer); clearInterval(inputTimer); console.log(JSON.stringify(result)); process.exitCode = result.started && result.finalized && result.audioBytes > 0 && !result.error ? 0 : 1; });

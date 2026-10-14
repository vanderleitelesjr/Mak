import test from 'node:test';
import assert from 'node:assert/strict';
import { terminalClipboardGate } from '../../../src/desktop/terminalClipboard.ts';

test('terminal clipboard requires a fresh trusted foreground gesture, never replay or read access', () => {
  let time = 100;
  const gate = terminalClipboardGate(() => time), data = 'c;' + Buffer.from('Selected text ✓').toString('base64');
  assert.equal(gate.read(data, true, true), null);
  gate.arm(false); assert.equal(gate.read(data, true, true), null);
  gate.arm(true); assert.equal(gate.read(data, false, true), null);
  assert.equal(gate.read(data, true, false), null);
  assert.equal(gate.read('c;?', true, true), null);
  assert.equal(gate.read('p;YQ==', true, true), null);
  assert.equal(gate.read('c;/w==', true, true), null, 'invalid UTF-8');
  assert.equal(gate.read('c;@@==', true, true), null);
  assert.equal(gate.read('c;' + 'a'.repeat(4 * 1024 * 1024 + 4), true, true), null);
  assert.equal(gate.read(data, true, true), 'Selected text ✓');
  assert.equal(gate.read(data, true, true), null, 'one write per gesture');
  gate.arm(true); time += 2001; assert.equal(gate.read(data, true, true), null);
  gate.arm(true); gate.clear(); assert.equal(gate.read(data, true, true), null, 'blur revokes consent');
});

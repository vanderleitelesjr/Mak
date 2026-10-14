import test from 'node:test';
import assert from 'node:assert/strict';
import { readingVoices } from '../../../src/mobile/readingVoices.ts';
import { LocalReadAloud } from '../local-read-aloud.mjs';
test('exact fixed voices and strict synthesis inputs', async () => {
  assert.deepEqual(readingVoices, [{ id: 'am_michael', label: 'Michael · US man' }, { id: 'bf_emma', label: 'Emma · UK woman' }]);
  const speech = new LocalReadAloud('missing-model-fixture');
  await assert.rejects(speech.synthesize('phone', { voice: 'local-au', text: 'hello' }), error => error.status === 400);
  await assert.rejects(speech.synthesize('phone', { voice: 'am_michael', text: 'x'.repeat(2001) }), error => error.status === 400);
  await assert.rejects(speech.synthesize('phone', { voice: 'am_michael', text: 'hello' }), error => error.status === 503);
  speech.close();
});

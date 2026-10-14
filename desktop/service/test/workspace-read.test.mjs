import test from 'node:test';
import assert from 'node:assert/strict';
import { stripCodeBlocks, Workspace } from '../workspace.mjs';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// The expression read() used before. Only run it on small, well-formed inputs:
// it is quadratic on unclosed opening tags.
const previous = text => text.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');

test('script and style removal matches the previous expression on closed blocks', () => {
  const pieces = ['<p>Text</p>', 'plain words ', '<script>let a = "<b>";</script>', '<STYLE media="x">p > a { color: red }</Style>', '<script src="a.js"></script>', '<style>\n</style>', '</script>', '<scripted>kept</scripted>', '<styles>', 'a > b', '<!-- <script>c</script> -->', 'İ<script>d</script>'];
  let seed = 7;
  const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648);
  for (let round = 0; round < 400; round++) {
    let text = '';
    for (let count = next() % 9; count > 0; count--) text += pieces[next() % pieces.length];
    assert.equal(stripCodeBlocks(text), previous(text), JSON.stringify(text));
  }
});

test('an unclosed block hides the rest of the report', () => {
  assert.equal(stripCodeBlocks('Before<script>fetch("x")'), 'Before ');
  assert.equal(stripCodeBlocks('Before<style>p{}</script>after'), 'Before ');
  assert.equal(stripCodeBlocks('A<script>1</script>B<style>'), 'A B ');
  assert.equal(stripCodeBlocks('Before<script never closed'), 'Before<script never closed');
});

test('three megabytes of unclosed opening tags are handled in linear time', () => {
  for (const unit of ['<script>', '<style>', '<script ', '<script><style>']) {
    const text = unit.repeat(Math.ceil(3 * 1024 * 1024 / unit.length));
    const started = performance.now();
    stripCodeBlocks(text);
    assert.ok(performance.now() - started < 1000, `${JSON.stringify(unit)} took too long`);
  }
});

test('reading a report with many unclosed generic tags does not stall', async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), 'mrmak-report-read-'));
  await mkdir(path.join(repo, 'workspace'));
  await writeFile(path.join(repo, 'workspace/workspace.json'), JSON.stringify({ entities: [{ id: 'malformed', title: 'Malformed report', folder: '.', steps: [{ name: 'Report', path: 'malformed.html' }] }] }));
  await writeFile(path.join(repo, 'workspace/malformed.html'), 'Before ' + '<unclosed '.repeat(280000));
  const started = performance.now();
  const result = await new Workspace(repo).read('malformed');
  assert.ok(result.text.startsWith('Before'));
  assert.equal(result.text.length, 12000);
  assert.ok(performance.now() - started < 2000);
});

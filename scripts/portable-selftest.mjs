#!/usr/bin/env node
import {mkdtempSync, existsSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {baseEpisodeId, getEpisodeDir, newEpisode} from './ep-dir.mjs';

const dir = mkdtempSync(join(tmpdir(), 'weilanx-portable-'));
try {
  assert.equal(baseEpisodeId('ep123-demo-tall'), 'ep123-demo');
  assert.throws(() => baseEpisodeId('../etc'), /Invalid/);
  assert.throws(() => getEpisodeDir('ep123-demo', 'materials', dir), /No materials/);
  const mat = newEpisode('ep123-demo', '05-暗金文献风', '演示视频', dir);
  assert(existsSync(join(mat, '.ep')));
  assert.equal(readFileSync(join(mat, '.ep'), 'utf8').trim(), 'ep123-demo');
  assert.equal(getEpisodeDir('ep123-demo', 'materials', dir), mat);
  assert(getEpisodeDir('ep123-demo-tall', 'out', dir).endsWith('竖版'));
  assert.equal(newEpisode('ep123-demo', '05-暗金文献风', '重名', dir), mat);
  assert.throws(() => newEpisode('ep124-unsafe', '../escape', 'xxx', dir), /Invalid/);
  console.log('✓ Portable episode directory self-test passed');
} finally {rmSync(dir, {recursive: true, force: true});}

#!/usr/bin/env node
/** Rebuild the shared synth track and per-episode audio in a portable way. */
import {spawnSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {PROJECT_ROOT} from './ep-dir.mjs';

function execute(path) {
  const result = spawnSync(process.execPath, [path], {cwd: PROJECT_ROOT, stdio: 'inherit'});
  return !result.error && result.status === 0;
}
const base = join(PROJECT_ROOT, 'audio');
if (!execute(join(base, 'synth.mjs'))) {
  console.error('✗ Could not generate shared audio.');
  process.exit(1);
}
let failed = 0;
for (const name of readdirSync(join(base, 'episodes')).filter((n) => n.endsWith('.mjs')).sort()) {
  const ok = execute(join(base, 'episodes', name));
  if (!ok) {failed++; console.error(`✗ Audio generation failed: ${name} (possibly missing licensed music / voice)`);}
}
if (failed) {
  console.error(`Completed shared audio but ${failed} episodes need their private source audio.`);
  process.exitCode = 1;
}

#!/usr/bin/env node
/** Environment preflight: actionable diagnostics before starting a video workflow. */
import {existsSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {PROJECT_ROOT} from './ep-dir.mjs';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const asJson = args.includes('--json');
const idx = args.indexOf('--music');
const requiredTrack = idx >= 0 ? args[idx + 1] : null;
const issues = [];
function check(name, good, critical, detail = '') {
  issues.push({name, ok: Boolean(good), critical, detail});
}
function version(command, argv) {
  const r = spawnSync(command, argv, {encoding: 'utf8', timeout: 7000, shell: process.platform === 'win32' && command.endsWith('.cmd')});
  return r.error || r.status !== 0 ? null : (r.stdout || r.stderr).trim().split('\n')[0];
}
const nodeMajor = Number(process.versions.node.split('.')[0]);
check('Node.js', nodeMajor >= 22, true, `Detected ${process.version}; Node.js 24 recommended`);
check('npm', Boolean(version(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['--version'])), true, 'Install npm together with Node.js');
check('ffmpeg', Boolean(version('ffmpeg', ['-version'])), true, 'Install FFmpeg and add it to PATH');
check('ffprobe', Boolean(version('ffprobe', ['-version'])), true, 'Install FFprobe (distributed with FFmpeg)');
check('Python', Boolean(version(process.platform === 'win32' ? 'python' : 'python3', ['--version'])), false, 'Needed by some distillation/asset Skills');
check('uv', Boolean(version('uv', ['--version'])), false, 'Optional Python package runner used by existing Skills');
check('Project dependencies', existsSync(join(PROJECT_ROOT, 'node_modules', 'remotion')), true, 'Run npm ci at project root');
check('Local fonts', existsSync(join(PROJECT_ROOT, 'public', 'fonts')), false, 'Check local fonts and fallback on this OS');
const musicDir = join(PROJECT_ROOT, 'public', 'music');
const music = existsSync(musicDir) ? readdirSync(musicDir).filter((n) => /\.(mp3|wav|m4a|flac)$/i.test(n)) : [];
check('Authorized music', music.length > 0, Boolean(requiredTrack), 'Put music you are licensed to use in public/music/; originals are not distributed');
if (requiredTrack) {
  check(`Required track: ${requiredTrack}`, music.includes(requiredTrack) || music.includes(`${requiredTrack}.mp3`) || music.includes(`${requiredTrack}.wav`), true, 'Supply your licensed music and adjust its beat grid');
}
check('Real footage / voices', true, false, 'Voice recordings and original B-roll from the author are deliberately absent');
const fail = issues.some((x) => !x.ok && x.critical);
const report = {ok: !fail, strict, platform: process.platform, issues};
if (asJson) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`Video Factory preflight (${process.platform} / Node ${process.version})`);
  for (const i of issues) console.log(`${i.ok ? '✓' : i.critical ? '✗' : '!'} ${i.name}: ${i.detail}`);
  console.log(fail ? '\nPreflight failed: resolve required dependencies before export.' : '\nRequired preflight checks passed.');
}
if (strict && fail) process.exitCode = 1;

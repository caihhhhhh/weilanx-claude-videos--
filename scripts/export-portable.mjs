#!/usr/bin/env node
/** Windows/macOS/Linux exporter, compatible with existing episode conventions. */
import {spawnSync} from 'node:child_process';
import {copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {baseEpisodeId, getEpisodeDir, PROJECT_ROOT} from './ep-dir.mjs';
import {runRemotion} from './remotion-cli.mjs';
import {inspectMedia} from './qa-media.mjs';

function exec(command, args) {
  const result = spawnSync(command, args, {cwd: PROJECT_ROOT, stdio: 'inherit', env: {...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=4096'}});
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error?.message || `exit status ${result.status}`}`);
}
function ffmpeg(args) {exec('ffmpeg', ['-v', 'error', '-y', ...args]);}
function mixStems(mp4, voice, bgm, sfx, output) {
  const mix = '[1:a]aformat=sample_rates=48000:channel_layouts=stereo[v];' +
    '[2:a]aformat=sample_rates=48000:channel_layouts=stereo[b];' +
    '[3:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=-3dB[s];' +
    '[v][b][s]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.89:attack=2:release=50:level=disabled[a]';
  ffmpeg(['-i', mp4, '-i', voice, '-i', bgm, '-i', sfx,
    '-filter_complex', mix, '-map', '0:v:0', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', output]);
}
export function exportEpisode(id, {aspect = null} = {}) {
  const base = baseEpisodeId(id);
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id)) throw new Error('Invalid episode ID');
  const out = getEpisodeDir(id, 'out', PROJECT_ROOT, {createVariant: true});
  const materials = getEpisodeDir(id, 'materials');
  const audio = join(PROJECT_ROOT, 'public', 'audio', base);
  const requiresVoice = existsSync(join(PROJECT_ROOT, 'src', 'episodes', base, 'cues.ts')) || existsSync(join(PROJECT_ROOT, 'src', 'episodes', base, 'cues.json'));
  const requiresBgm = existsSync(join(PROJECT_ROOT, 'audio', 'episodes', `${base}.mjs`));
  const voice = join(audio, 'voice.wav');
  const bgm = join(audio, 'bgm.wav');
  if (requiresVoice && !existsSync(voice)) throw new Error(`Required voice file missing: ${voice}`);
  if ((requiresBgm || existsSync(voice)) && !existsSync(bgm)) throw new Error(`Required BGM missing: ${bgm}. Generate or add licensed audio before exporting.`);
  mkdirSync(out, {recursive: true});
  const mp4 = join(out, `${id}.mp4`);
  console.log(`Rendering ${id} → ${mp4}`);
  runRemotion(['render', 'src/index.ts', id, mp4, '--crf=18', '--log=error']);
  if (existsSync(voice)) {
    const stems = join(out, 'stems');
    mkdirSync(stems, {recursive: true});
    const sfx = join(stems, 'sfx.wav');
    runRemotion(['render', 'src/index.ts', id, sfx, '--codec=wav', '--props={"mix":"sfx"}', '--log=error']);
    copyFileSync(voice, join(stems, 'voice.wav'));
    copyFileSync(bgm, join(stems, 'bgm.wav'));
    const mixed = join(out, `.mixed-${id}.mp4`);
    mixStems(mp4, voice, bgm, sfx, mixed);
    renameSync(mixed, mp4);
  }
  for (const doc of ['封面-3x4.png', '封面-16x9.png', '封面-9x16.png', '字幕稿.md', '字幕.srt', '发布文案.md']) {
    const source = join(materials, doc);
    if (existsSync(source)) copyFileSync(source, join(out, doc));
  }
  const qa = inspectMedia(mp4, {aspect});
  const report = join(out, 'QA-report.json');
  writeFileSync(report, JSON.stringify(qa, null, 2) + '\n');
  if (!qa.ok) throw new Error(`Export media QA failed; see ${report}: ${qa.errors.join('; ')}`);
  console.log(`✓ ${mp4}\n✓ ${report}`);
  return {mp4, report};
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [id, ...args] = process.argv.slice(2);
    if (!id) throw new Error('Usage: node scripts/export-portable.mjs <episode> [--aspect 9:16]');
    const i = args.indexOf('--aspect');
    const aspect = i >= 0 ? args[i + 1] : null;
    exportEpisode(id, {aspect});
  } catch (e) {console.error(`✗ ${e.message}`); process.exitCode = 1;}
}

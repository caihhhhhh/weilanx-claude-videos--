#!/usr/bin/env node
/** Shared media QA for any video Skill. Does not replace semantic/visual frame review. */
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function run(command, args) {
  const r = spawnSync(command, args, {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 600000});
  if (r.error || r.status !== 0) throw new Error(`${command} failed: ${r.error?.message ?? (r.stderr || '').slice(-1600)}`);
  return (r.stdout ?? '') + '\n' + (r.stderr ?? '');
}
function parseArgs(argv) {
  const file = argv[0];
  if (!file || file.startsWith('--')) throw new Error('Usage: node scripts/qa-media.mjs VIDEO.mp4 [--aspect 9:16] [--report report.json] [--strict]');
  const get = (flag) => {const i = argv.indexOf(flag); return i === -1 ? null : argv[i + 1];};
  return {file, aspect: get('--aspect'), report: get('--report'), strict: argv.includes('--strict'), allowNoAudio: argv.includes('--allow-no-audio')};
}
export function inspectMedia(filepath, options = {}) {
  const file = resolve(filepath);
  if (!existsSync(file)) throw new Error(`Video not found: ${file}`);
  const info = JSON.parse(run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file]));
  const streams = info.streams || [];
  const video = streams.find((s) => s.codec_type === 'video');
  const audio = streams.find((s) => s.codec_type === 'audio');
  const duration = Number(info.format?.duration ?? 0);
  const errors = [], warnings = [];
  if (!video) errors.push('No video stream');
  if (!(duration > 0)) errors.push('Missing or invalid duration');
  if (!audio && !options.allowNoAudio) errors.push('No audio stream; confirm voice/BGM/SFX dependency');
  let actualAspect = null;
  if (video) {
    actualAspect = `${video.width}:${video.height}`;
    if (!video.width || !video.height) errors.push('Invalid resolution');
    if (options.aspect) {
      const match = /^(\d+):(\d+)$/.exec(options.aspect);
      if (!match) errors.push(`Invalid requested aspect: ${options.aspect}`);
      else if (Math.abs(video.width / video.height - Number(match[1]) / Number(match[2])) > 0.001) {
        errors.push(`Aspect mismatch: requested ${options.aspect}, got ${actualAspect}`);
      }
    }
  }
  let integratedLufs = null, truePeakDbfs = null;
  if (audio) {
    const loud = run('ffmpeg', ['-nostats', '-hide_banner', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
    const summary = loud.split('Summary:').pop();
    integratedLufs = Number(/\bI:\s*(-?[\d.]+) LUFS/.exec(summary)?.[1] ?? NaN);
    truePeakDbfs = Number(/Peak:\s*(-?[\d.]+) dBFS/.exec(summary)?.[1] ?? NaN);
    if (!Number.isFinite(integratedLufs) || !Number.isFinite(truePeakDbfs)) warnings.push('Could not parse FFmpeg audio metering');
    else {
      if (integratedLufs > -13 || integratedLufs < -24) warnings.push(`Check loudness: ${integratedLufs} LUFS`);
      if (truePeakDbfs > -1) warnings.push(`Audio true peak above -1 dBFS: ${truePeakDbfs} dBFS`);
    }
  }
  return {
    ok: errors.length === 0, file, durationSeconds: duration,
    video: video ? {codec: video.codec_name, width: video.width, height: video.height, fps: video.avg_frame_rate} : null,
    audio: audio ? {codec: audio.codec_name, integratedLufs, truePeakDbfs} : null,
    errors, warnings,
    note: 'Automated checks do not verify facts, legibility, copyright, soundtrack perception or frame quality. Review representative frames before publishing.',
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const {file, aspect, report, strict, allowNoAudio} = parseArgs(process.argv.slice(2));
    const res = inspectMedia(file, {aspect, allowNoAudio});
    const rendered = JSON.stringify(res, null, 2);
    console.log(rendered);
    if (report) {
      const target = resolve(report);
      mkdirSync(dirname(target), {recursive: true});
      writeFileSync(target, `${rendered}\n`);
    }
    if (strict && !res.ok) process.exitCode = 1;
  } catch (e) {console.error(`✗ QA failed: ${e.message}`); process.exitCode = 1;}
}

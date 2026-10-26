#!/usr/bin/env node
/** Portable alternative to ep-dir.sh. No implicit filesystem mutations on lookup. */
import {existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assertPart = (v, name) => {
  if (!v || v === '.' || v === '..' || /[\\/\u0000-\u001f]/u.test(v) || v.includes('..')) {
    throw new Error(`Invalid ${name}: ${JSON.stringify(v)}`);
  }
  return v;
};
export const baseEpisodeId = (id) => assertPart(id, 'episode id').replace(/-tall$/, '');

function findDirs(root, expected) {
  if (!existsSync(root)) return [];
  const found = [];
  const pending = [root];
  while (pending.length) {
    const dir = pending.pop();
    for (const e of readdirSync(dir, {withFileTypes: true})) {
      if (e.isDirectory()) pending.push(join(dir, e.name));
      if (e.isFile() && e.name === '.ep' && readFileSync(join(dir, e.name), 'utf8').trim() === expected) found.push(dir);
    }
  }
  return found;
}
function uniqueDir(root, id) {
  const results = findDirs(root, id);
  if (results.length > 1) throw new Error(`Duplicate episode directories for ${id}: ${results.join(', ')}`);
  return results[0] ?? null;
}
function mark(dir, id) {
  mkdirSync(dir, {recursive: true});
  writeFileSync(join(dir, '.ep'), `${id}\n`, {flag: 'wx'});
}

export function newEpisode(id, style, title, root = PROJECT_ROOT) {
  const base = baseEpisodeId(id);
  assertPart(style, 'style');
  assertPart(title, 'title');
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(base)) throw new Error('Episode ID must use letters, numbers, underscore or hyphen');
  const existing = uniqueDir(join(root, 'materials'), base);
  if (existing) return existing;
  const parent = join(root, 'materials', style);
  mkdirSync(parent, {recursive: true});
  const serials = readdirSync(parent, {withFileTypes: true})
    .filter((x) => x.isDirectory() && /^\d+-/.test(x.name))
    .map((x) => Number(x.name.split('-')[0]));
  const serial = String(Math.max(-1, ...serials) + 1).padStart(2, '0');
  const segment = `${serial}-${title}`;
  const mat = join(root, 'materials', style, segment);
  const out = join(root, 'out', style, segment);
  if (existsSync(mat) || existsSync(out)) throw new Error(`Episode path collision: ${segment}`);
  mark(mat, base);
  mark(out, base);
  return mat;
}

export function getEpisodeDir(id, kind = 'materials', root = PROJECT_ROOT, {createUncategorized = false, createVariant = false} = {}) {
  if (!['materials', 'out'].includes(kind)) throw new Error('Directory kind must be materials or out');
  const base = baseEpisodeId(id);
  const rootDir = join(root, kind);
  let dir = uniqueDir(rootDir, base);
  if (!dir && createUncategorized) {
    dir = join(rootDir, '未分类', base);
    mark(dir, base);
  }
  if (!dir) throw new Error(`No ${kind} directory for ${base}. Run: node scripts/ep-dir.mjs ${base} materials --new <style> <title>`);
  if (kind === 'out' && id !== base) {
    dir = join(dir, '竖版');
    if (createVariant) mkdirSync(dir, {recursive: true});
  }
  return dir;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [id, kind = 'materials', ...flags] = process.argv.slice(2);
    if (!id) throw new Error('Usage: node scripts/ep-dir.mjs <episode> [materials|out] [--new <style> <title>]');
    const i = flags.indexOf('--new');
    if (i !== -1) {
      if (kind !== 'materials' || flags.length !== 3 || i !== 0) throw new Error('Use: <episode> materials --new <style> <title>');
      newEpisode(id, flags[1], flags[2]);
    }
    console.log(getEpisodeDir(id, kind, PROJECT_ROOT, {createUncategorized: flags.includes('--allow-uncategorized')}));
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exitCode = 1;
  }
}

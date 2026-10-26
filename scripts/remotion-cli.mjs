#!/usr/bin/env node
/** Remotion CLI using its Node entrypoint, without OS-specific npm .bin shims. */
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PROJECT_ROOT} from './ep-dir.mjs';

export function runRemotion(args) {
  const dir = join(PROJECT_ROOT, 'node_modules', '@remotion', 'cli');
  const manifest = join(dir, 'package.json');
  if (!existsSync(manifest)) throw new Error('Missing @remotion/cli. Run npm ci.');
  const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
  const relativeBin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.remotion;
  if (!relativeBin) throw new Error('Could not find Remotion CLI entrypoint in package metadata.');
  const bin = resolve(dir, relativeBin);
  if (!existsSync(bin)) throw new Error(`Remotion CLI file missing: ${bin}`);
  const result = spawnSync(process.execPath, [bin, ...args], {
    cwd: PROJECT_ROOT, stdio: 'inherit',
    env: {...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=4096'},
  });
  if (result.error || result.status !== 0) throw new Error(`Remotion failed: ${result.error?.message || `exit ${result.status}`}`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {runRemotion(process.argv.slice(2));}
  catch (error) {console.error(`✗ ${error.message}`); process.exitCode = 1;}
}

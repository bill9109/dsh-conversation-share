#!/usr/bin/env node
// Hot-install a dsh bundle into a profile WITHOUT restarting dsh web.
//
// The standard `dsh plugin add` appends the bundle to `dsh.profile.bundles`,
// which is composed once at boot, so it needs a restart. This helper instead
// installs the package and registers it through the profile's OWN
// cordis.patch.yml (the user patch layer). DSH web hot-reloads that layer at
// runtime (watchUserPatches -> HMR), so the plugin mounts without a restart.
//
// Usage:
//   node scripts/install-hot.mjs --profile web --spec dsh-conversation-share@latest
//   node scripts/install-hot.mjs --profile web --dir /path/to/dsh-conversation-share
//
// After it runs, hard-refresh the browser (Cmd+Shift+R) ONCE to pick up the
// new client bundle. Do NOT also `dsh plugin add` the same plugin (a
// duplicate patch insert for the same id makes the plugin load twice).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import os from 'node:os'

// ---- args --------------------------------------------------------------
const args = process.argv.slice(2)
const get = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const profile = get('--profile') ?? 'web'
const spec = get('--spec')
const dir = get('--dir')
if (!spec && !dir) {
  console.error('usage: node scripts/install-hot.mjs --profile <name> (--spec <pkg> | --dir <path>)')
  process.exit(1)
}

// ---- resolve paths ------------------------------------------------------
const dshHome = process.env.DSH_HOME ?? join(os.homedir(), '.dsh')
const profileDir = join(dshHome, 'profiles', profile)
if (!existsSync(profileDir)) {
  console.error('error: profile dir not found: ' + profileDir)
  console.error('hint: run `dsh --profile ' + profile + ' --help` once to initialize it.')
  process.exit(1)
}
const manifestPath = join(profileDir, 'package.json')
const patchPath = join(profileDir, 'cordis.patch.yml')
if (!existsSync(manifestPath)) {
  console.error('error: ' + manifestPath + ' not found; is ' + profile + ' a dsh profile?')
  process.exit(1)
}

// ---- install (no bundles change) ----------------------------------------
const before = JSON.parse(readFileSync(manifestPath, 'utf8'))
const beforeDeps = Object.keys(before.dependencies ?? {})
const installSpec = dir ? 'file:' + resolve(dir) : spec
console.log('[1/3] pnpm add "' + installSpec + '" in ' + profileDir + ' (does NOT touch bundles)')
execFileSync('pnpm', ['add', installSpec], { cwd: profileDir, stdio: 'inherit' })
const after = JSON.parse(readFileSync(manifestPath, 'utf8'))
const afterDeps = Object.keys(after.dependencies ?? {})
const newDeps = afterDeps.filter((k) => !beforeDeps.includes(k))
if (newDeps.length === 0) {
  console.error('-> did not detect a new dependency; is the package already installed?')
  process.exit(1)
}
const pkgName = newDeps[0]
console.log('    installed dependency: ' + pkgName)

const pkgDir = join(profileDir, 'node_modules', pkgName)
const pkgManifestPath = join(pkgDir, 'package.json')
const pkgPatchPath = join(pkgDir, 'cordis.patch.yml')
if (!existsSync(pkgManifestPath)) {
  console.error('error: ' + pkgDir + ' not found')
  process.exit(1)
}
const pkgManifest = JSON.parse(readFileSync(pkgManifestPath, 'utf8'))
if (!pkgManifest.dsh?.bundle) {
  console.error('error: ' + pkgName + ' does not declare dsh.bundle; not a dsh bundle')
  process.exit(1)
}

// ---- determine the insert row id from the package's own patch ------------
let rowId = pkgName
if (existsSync(pkgPatchPath)) {
  const text = readFileSync(pkgPatchPath, 'utf8')
  const m = text.includes('- id: ') ? text.split('- id: ')[1].split('\n')[0].trim() : null
  if (m) rowId = m
}
const rowName = pkgName

// ---- register in the user patch layer ------------------------------------
const snippet = '- insert:\n  - id: ' + rowId + '\n    name: \'' + rowName + '\'\n'
if (existsSync(patchPath)) {
  const current = readFileSync(patchPath, 'utf8')
  if (current.includes('id: ' + rowId)) {
    console.error('-> ' + patchPath + ' already inserts id "' + rowId + '"; nothing to do')
    console.error('hint: hard-refresh the browser once (Cmd+Shift+R) if the capsule is missing.')
    process.exit(0)
  }
  const stripped = current.replace(/^#.*$/gm, '').replace(/\s+/g, '').trim()
  if (stripped === '[]') {
    writeFileSync(patchPath, '# Hot-install registration for ' + pkgName + ' (user patch layer; hot-reloaded, no restart).' + '\n' + '# To revert, delete this block and the ' + pkgName + ' dependency.' + '\n' + snippet)
    console.log('[2/3] wrote hot-install registration to ' + patchPath)
  } else {
    console.error('-> profile cordis.patch.yml is not an empty array; merge this snippet by hand:')
    console.error(snippet.trimEnd())
    console.error('file: ' + patchPath)
    process.exit(0)
  }
} else {
  writeFileSync(patchPath, snippet)
  console.log('[2/3] created ' + patchPath)
}

// ---- guidance ------------------------------------------------------------
console.log('')
console.log('[3/3] Done. DSH web should have hot-reloaded the user patch layer and mounted the plugin:')
console.log('  1. Hard-refresh the browser ONCE (Cmd+Shift+R) to load the new client bundle.')
console.log('  2. Do NOT also run: dsh plugin --profile ' + profile + ' add ' + pkgName + '  (would duplicate the insert).')
console.log('  3. Verify: dsh --profile ' + profile + ' --dump-config | grep ' + rowId)

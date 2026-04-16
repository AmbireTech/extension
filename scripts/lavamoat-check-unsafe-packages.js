#!/usr/bin/env node
/**
 * Fails when yarn.lock changes (vs the base branch) for packages that are excluded
 * from LavaMoat compartment wrapping. Those packages run without SES sandboxing in
 * the bundle, so lockfile bumps need explicit vulnerability review.
 */
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const lockfile = require('@yarnpkg/lockfile')

const CONFIG_REL = path.join('lavamoat', 'webpack', 'unsafe-packages.json')
const LOCKFILE = 'yarn.lock'
const BASE_REF = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/v2'

function loadPackageNames() {
  const configPath = path.join(process.cwd(), CONFIG_REL)
  const data = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  const packages = data.packages
  if (!Array.isArray(packages) || !packages.every((p) => typeof p === 'string' && p.length)) {
    throw new Error(`${CONFIG_REL} must contain a non-empty "packages" string array`)
  }
  return packages
}

function readBaseLockfile() {
  return execFileSync('git', ['show', `${BASE_REF}:${LOCKFILE}`], {
    encoding: 'utf8'
  })
}

function parseLock(text) {
  const { object } = lockfile.parse(text)
  if (!object) {
    throw new Error('Failed to parse yarn.lock')
  }
  return object
}

/**
 * All lockfile entries that resolve this package (Yarn v1 may use combined keys).
 */
function slicesForPackage(lockObject, packageName) {
  const prefix = `${packageName}@`
  const slice = {}

  for (const key of Object.keys(lockObject)) {
    const trimmed = key.replace(/:\s*$/, '')
    const selectors = trimmed.split(/,\s*/)
    for (const sel of selectors) {
      if (sel.startsWith(prefix)) {
        slice[key] = lockObject[key]
        break
      }
    }
  }

  return slice
}

function stableStringify(obj) {
  const keys = Object.keys(obj).sort()
  const sorted = {}
  for (const k of keys) {
    sorted[k] = obj[k]
  }
  return JSON.stringify(sorted, null, 2)
}

function main() {
  const packageNames = loadPackageNames()
  const headText = fs.readFileSync(LOCKFILE, 'utf8')
  let baseText
  try {
    baseText = readBaseLockfile()
  } catch (e) {
    console.error(`Could not read ${BASE_REF}:${LOCKFILE} — did you fetch the base branch?`)
    console.error(e?.message || e)
    process.exit(2)
  }

  const headObj = parseLock(headText)
  const baseObj = parseLock(baseText)

  const changed = []

  for (const name of packageNames) {
    const headSlice = slicesForPackage(headObj, name)
    const baseSlice = slicesForPackage(baseObj, name)

    if (stableStringify(headSlice) !== stableStringify(baseSlice)) {
      changed.push(name)
    }
  }

  if (changed.length === 0) {
    console.log(`✅ No changes to packages excluded from LavaMoat (${CONFIG_REL}) vs ${BASE_REF}.`)
    return
  }

  console.error(
    `\n❌ Changes detected for packages excluded from LavaMoat (${CONFIG_REL}) vs ${BASE_REF}:`
  )
  changed.forEach((p) => console.error(`   - ${p}`))
  console.error(`
These packages are not protected by LavaMoat. Before merging the PR, please make sure you review the code of these packages and ensure they are not vulnerable.`)
  process.exit(1)
}

main()

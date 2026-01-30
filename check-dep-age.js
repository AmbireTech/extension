#!/usr/bin/env node
const fs = require('fs')
const { execFileSync } = require('child_process')
const lockfile = require('@yarnpkg/lockfile')

/* -------- config -------- */

const MIN_DAYS = Number(process.argv[2] || 14)
const LOCKFILE = 'yarn.lock'
const REGISTRY = 'https://registry.npmjs.org'
const BASE_REF = process.env.GITHUB_BASE_REF
  ? `origin/${process.env.GITHUB_BASE_REF}`
  : 'origin/main'

/* -------- helpers -------- */

function readBaseLockfile() {
  return execFileSync('git', ['show', `${BASE_REF}:${LOCKFILE}`], {
    encoding: 'utf8'
  })
}

function parseLockfile(text) {
  // Keep it strict: if parsing doesn't succeed, `object` will be undefined and the script will fail.
  return lockfile.parse(text).object
}

function extractResolvedPackages(lockObject) {
  // returns Set of "name@version"
  const result = new Set()

  for (const key of Object.keys(lockObject)) {
    const entry = lockObject[key]
    if (!entry || !entry.version) {
      throw new Error(`Invalid lockfile entry for key: ${key}`)
    }

    for (const selector of key.split(/,\s*/)) {
      const at = selector.lastIndexOf('@')
      if (at > 0) {
        const name = selector.slice(0, at)
        result.add(`${name}@${entry.version}`)
      }
    }
  }

  return result
}

function getChangedPackages() {
  const headText = fs.readFileSync(LOCKFILE, 'utf8')
  const baseText = readBaseLockfile()

  const headPackages = extractResolvedPackages(parseLockfile(headText))
  const basePackages = extractResolvedPackages(parseLockfile(baseText))

  return [...headPackages].filter((pkg) => !basePackages.has(pkg))
}

async function fetchPackageMetadata(name) {
  const res = await fetch(`${REGISTRY}/${encodeURIComponent(name)}`, {
    headers: { Accept: 'application/json' }
  })
  return res.json()
}

async function checkPackageAges(packages, minDays) {
  const now = Date.now()
  const minMs = minDays * 24 * 60 * 60 * 1000

  const unresolved = []
  const tooNew = []

  for (const item of packages) {
    const idx = item.lastIndexOf('@')
    const name = item.slice(0, idx)
    const version = item.slice(idx + 1)

    try {
      const meta = await fetchPackageMetadata(name)
      const publishedAt = meta?.time?.[version]

      if (!publishedAt) {
        unresolved.push(item)
        continue
      }

      const ageMs = now - Date.parse(publishedAt)
      if (ageMs < minMs) {
        const ageDays = Math.floor(ageMs / 86400000)
        tooNew.push(`${item} (${ageDays}d old)`)
      }
    } catch {
      unresolved.push(item)
    }
  }

  return { unresolved, tooNew }
}

/* -------- main -------- */

;(async () => {
  const changed = getChangedPackages()

  if (changed.length === 0) {
    console.log(`✅ No new resolved dependencies vs ${BASE_REF}`)
    return
  }

  console.log(`Checking ${changed.length} new dependency versions`)
  console.log(`Min age: ${MIN_DAYS} days`)

  const { unresolved, tooNew } = await checkPackageAges(changed, MIN_DAYS)

  if (unresolved.length) {
    console.error('\n❌ Could not resolve publish time for:')
    unresolved.forEach((p) => console.error(' -', p))
  }

  if (tooNew.length) {
    console.error(`\n❌ Dependencies newer than ${MIN_DAYS} days:`)
    tooNew.forEach((p) => console.error(' -', p))
  }

  if (unresolved.length || tooNew.length) {
    process.exit(1)
  }

  console.log(`✅ All new dependencies are at least ${MIN_DAYS} days old`)
})().catch((e) => {
  console.error(e?.stack || e)
  process.exit(2)
})

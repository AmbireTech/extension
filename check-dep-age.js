#!/usr/bin/env node
/**
 * Dependency age gate for Yarn v1 (Classic).
 *
 * What it does:
 *  - Parses yarn.lock to get every resolved (name, version) used (including transitives)
 *  - Queries the npm registry for publish timestamps
 *  - Fails if any dependency version is younger than --min-days (default 14)
 *
 * Usage:
 *  node check-dep-age.js --min-days 14
 *
 * Notes:
 *  - Uses @yarnpkg/lockfile to parse yarn.lock reliably
 *  - Reads registry from npm_config_registry / NPM_CONFIG_REGISTRY if present
 *  - Uses the full npm registry packument (Accept: application/json) so publish times are available
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const { execFileSync } = require('child_process')

function parseArgs(argv) {
  // Defaults; overridden by CLI flags.
  const args = {
    minDays: 14,
    lockfile: 'yarn.lock',
    registry: null,
    ignore: [],
    trusted: [],
    mode: 'all', // all|changed
    baseRef: 'origin/main',
    failOnUnknown: false,
    concurrency: 8,
    retries: 3,
    timeoutMs: 15000
  }

  // Minimal argv parsing (no external deps).
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--min-days') args.minDays = Number(argv[++i])
    else if (a === '--lockfile') args.lockfile = argv[++i]
    else if (a === '--registry') args.registry = argv[++i]
    else if (a === '--ignore')
      args.ignore = argv[++i]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    else if (a === '--trusted')
      args.trusted = argv[++i]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    else if (a === '--mode') args.mode = String(argv[++i] || '').trim()
    else if (a === '--base-ref') args.baseRef = String(argv[++i] || '').trim()
    else if (a === '--fail-on-unknown') args.failOnUnknown = true
    else if (a === '--concurrency') args.concurrency = Number(argv[++i])
    else if (a === '--retries') args.retries = Number(argv[++i])
    else if (a === '--timeout-ms') args.timeoutMs = Number(argv[++i])
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: node check-dep-age.js [--min-days 14] [--lockfile yarn.lock] [--registry URL]
  [--mode all|changed] [--base-ref origin/main]
  [--ignore pkg1,pkg2] [--trusted @scope/*,@types/*]
  [--fail-on-unknown] [--concurrency 8] [--retries 3] [--timeout-ms 15000]

Exits 1 if any dep version is newer than min-days.`)
      process.exit(0)
    }
  }

  // Validate inputs so CI fails fast on misconfiguration.
  if (!Number.isFinite(args.minDays) || args.minDays < 0) {
    throw new Error(`Invalid --min-days: ${args.minDays}`)
  }
  if (args.mode !== 'all' && args.mode !== 'changed') {
    throw new Error(`Invalid --mode: ${args.mode} (expected all|changed)`)
  }
  if (!args.baseRef) {
    throw new Error(`Invalid --base-ref: ${args.baseRef}`)
  }
  if (!Number.isFinite(args.concurrency) || args.concurrency < 1) {
    throw new Error(`Invalid --concurrency: ${args.concurrency}`)
  }
  if (!Number.isFinite(args.retries) || args.retries < 0) {
    throw new Error(`Invalid --retries: ${args.retries}`)
  }
  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs < 1000) {
    throw new Error(`Invalid --timeout-ms: ${args.timeoutMs}`)
  }

  return args
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function requestJson(url, { retries = 3, timeoutMs = 15000 } = {}) {
  let attempt = 0
  // Retries on 429 (rate limit) and 5xx responses with exponential backoff.
  while (true) {
    attempt++
    try {
      const json = await new Promise((resolve, reject) => {
        const req = https.get(
          url,
          { headers: { Accept: 'application/json' }, timeout: timeoutMs },
          (res) => {
            let data = ''
            res.on('data', (c) => (data += c))
            res.on('end', () => {
              const code = res.statusCode || 0
              if (code >= 200 && code < 300) {
                try {
                  resolve(JSON.parse(data))
                } catch (e) {
                  reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`))
                }
                return
              }
              // Treat rate limits and transient server errors as retryable.
              const retryable = code === 429 || (code >= 500 && code <= 599)
              if (retryable) {
                const err = new Error(`HTTP ${code} for ${url}: ${data.slice(0, 200)}`)
                err.code = code
                reject(err)
                return
              }
              reject(new Error(`HTTP ${code} for ${url}: ${data.slice(0, 200)}`))
            })
          }
        )

        req.on('timeout', () => {
          req.destroy(new Error(`Request timeout after ${timeoutMs}ms`))
        })

        req.on('error', reject)
      })
      return json
    } catch (e) {
      // Back off between attempts to avoid hammering the registry.
      const status = e && typeof e.code === 'number' ? e.code : null
      const retryable = status === 429 || (status && status >= 500 && status <= 599)
      if (!retryable || attempt > retries) throw e
      const backoffMs = Math.min(10_000, 500 * Math.pow(2, attempt - 1))
      await sleep(backoffMs)
    }
  }
}

function npmViewTime(name, registry) {
  // Fallback when registry metadata doesn't include a usable `time` map.
  // We shell out to `npm view <name> time --json`, which is often more reliable.
  // This is a last resort; normal path is a single HTTP GET per package name.
  try {
    const out = execFileSync('npm', ['view', name, 'time', '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        npm_config_registry: registry,
        NPM_CONFIG_REGISTRY: registry
      }
    })
    const parsed = JSON.parse(out)
    if (parsed && typeof parsed === 'object') return parsed
    return null
  } catch {
    return null
  }
}

function normalizeRegistry(registry) {
  if (!registry) return 'https://registry.npmjs.org'
  // strip trailing slash
  return registry.endsWith('/') ? registry.slice(0, -1) : registry
}

function selectorToName(selector) {
  // selector examples:
  //  "lodash@^4.17.21"
  //  "@ethersproject/bytes@^5.7.0"
  // Take the last '@' as separator between name and range.
  const lastAt = selector.lastIndexOf('@')
  if (lastAt <= 0) return null
  return selector.slice(0, lastAt)
}

function normalizeVersionForRegistryTime(version) {
  // Yarn v1 lockfile may contain protocol-like prefixes for aliases
  // e.g. "npm:1.2.3". The npm registry `time` map uses bare semver.
  if (typeof version !== 'string') return version
  if (version.startsWith('npm:')) return version.slice('npm:'.length)
  return version
}

function getReasonCounts(items) {
  const counts = new Map()
  for (const it of items) {
    const r = it.reason || '(no reason)'
    counts.set(r, (counts.get(r) || 0) + 1)
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
}

function compilePatterns(patterns) {
  // Convert wildcard patterns like "@scope/*" into anchored regexes once.
  return (patterns || []).map((pattern) => {
    if (pattern.includes('*')) {
      const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
      return { pattern, regex: new RegExp(`^${escaped}$`) }
    }
    return { pattern, regex: null }
  })
}

function matchesPattern(name, compiled) {
  // Returns true if the package name matches any compiled trusted pattern.
  for (const p of compiled) {
    if (p.regex) {
      if (p.regex.test(name)) return true
    } else {
      if (name === p.pattern) return true
    }
  }
  return false
}

function getLockfileTextFromGit(ref, lockRelPath) {
  // Reads a historical lockfile from git (used in --mode changed). Returns null if unavailable.
  try {
    return execFileSync('git', ['show', `${ref}:${lockRelPath}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    })
  } catch {
    return null
  }
}

function buildPairsFromParsedLock(parsedObj) {
  // Builds a unique list of resolved (name, version) pairs from Yarn v1 lockfile entries.
  const pairsByName = new Map() // name -> Set(versions)
  const pairsList = []
  const seen = new Set()

  for (const key of Object.keys(parsedObj)) {
    // A single lock entry key may contain multiple selectors separated by commas.
    const selectors = key.split(/,\s*/g).filter(Boolean)
    const entry = parsedObj[key]
    if (!entry || !entry.version) continue

    for (const sel of selectors) {
      const name = selectorToName(sel.trim())
      if (!name) continue
      // entry.version is the resolved version Yarn will install for these selectors.
      const version = entry.version

      if (!pairsByName.has(name)) pairsByName.set(name, new Set())
      pairsByName.get(name).add(version)

      const k = `${name}@${version}`
      if (!seen.has(k)) {
        seen.add(k)
        pairsList.push({ name, version })
      }
    }
  }

  return { pairsByName, pairsList }
}

async function main() {
  const args = parseArgs(process.argv)

  // 1) Load lockfile parser and resolve paths.
  // Lazy-require so help still works if deps not installed
  let lockfile
  try {
    lockfile = require('@yarnpkg/lockfile')
  } catch (e) {
    console.error('Missing dependency: @yarnpkg/lockfile')
    console.error('Install it with: yarn add -D @yarnpkg/lockfile')
    process.exit(2)
  }

  const repoRoot = process.cwd()
  const lockPath = path.isAbsolute(args.lockfile)
    ? args.lockfile
    : path.join(repoRoot, args.lockfile)

  if (!fs.existsSync(lockPath)) {
    console.error(`Could not find lockfile at: ${lockPath}`)
    process.exit(2)
  }

  const lockRelPath = path.relative(repoRoot, lockPath).replace(/\\/g, '/')

  // 2) Decide which registry to query (explicit flag wins; then env; then npmjs).
  const registry = normalizeRegistry(
    args.registry || process.env.npm_config_registry || process.env.NPM_CONFIG_REGISTRY
  )

  console.log(`Using registry: ${registry}`)

  const ignored = new Set(args.ignore)
  const trustedCompiled = compilePatterns(args.trusted)

  // 3) Parse yarn.lock and extract the resolved dependency versions.
  const raw = fs.readFileSync(lockPath, 'utf8')
  const parsed = lockfile.parse(raw)

  if (parsed.type !== 'success' || !parsed.object) {
    console.error('Failed to parse yarn.lock')
    process.exit(2)
  }

  const currentPairs = buildPairsFromParsedLock(parsed.object)

  let depsToCheck = currentPairs.pairsList

  // 4) Optional: only check deps introduced/changed vs base ref's lockfile.
  if (args.mode === 'changed') {
    const baseText = getLockfileTextFromGit(args.baseRef, lockRelPath)
    if (!baseText) {
      console.log(
        `Base lockfile not found at ${args.baseRef}:${lockRelPath}; treating all dependencies as changed.`
      )
    } else {
      const baseParsed = lockfile.parse(baseText)
      if (baseParsed.type !== 'success' || !baseParsed.object) {
        console.log(
          `Failed to parse base lockfile from ${args.baseRef}:${lockRelPath}; treating all dependencies as changed.`
        )
      } else {
        const basePairs = buildPairsFromParsedLock(baseParsed.object)
        const changed = []
        for (const { name, version } of currentPairs.pairsList) {
          const baseVersions = basePairs.pairsByName.get(name)
          if (!baseVersions || !baseVersions.has(version)) {
            changed.push({ name, version })
          }
        }
        depsToCheck = changed
      }
    }
  }

  // 5) Apply local policy exceptions (exact ignore + wildcard trusted patterns).
  depsToCheck = depsToCheck.filter(({ name }) => {
    if (ignored.has(name)) return false
    if (trustedCompiled.length && matchesPattern(name, trustedCompiled)) return false
    return true
  })

  // Progress summary before starting
  console.log(
    `Checking ${depsToCheck.length} resolved dependencies (mode=${args.mode}, concurrency=${args.concurrency})`
  )

  const now = Date.now()
  const minMs = args.minDays * 24 * 60 * 60 * 1000

  // 6) Query publish timestamps (cache per package name so multiple versions don't refetch metadata).
  // Cache registry metadata per package
  const metaCache = new Map() // name -> metadata JSON

  const maxConcurrent = args.concurrency
  const items = Array.from(depsToCheck)
  let cursor = 0
  const tooNew = []
  const unknownPublishDates = []

  async function checkDependency({ name, version }) {
    // Per-package progress log (verbose only)
    if (process.env.DEP_AGE_VERBOSE === '1') {
      console.log(`→ Checking ${name}@${version}`)
    }
    // Fetch packument once per package name; includes publish times in `time`.
    let meta = metaCache.get(name)
    if (!meta) {
      if (process.env.DEP_AGE_VERBOSE === '1') {
        console.log(`  Fetching registry metadata for ${name}`)
      }
      const pkgUrl = `${registry}/${encodeURIComponent(name)}`
      meta = await requestJson(pkgUrl, { retries: args.retries, timeoutMs: args.timeoutMs })
      metaCache.set(name, meta)
    }

    // Normalize versions like "npm:1.2.3" so they match keys in the registry time map.
    const lookupVersion = normalizeVersionForRegistryTime(version)

    // Some registries/proxies omit `time`; fall back to npm CLI if needed.
    if (!meta || !meta.time) {
      if (process.env.DEP_AGE_VERBOSE === '1') {
        console.log(`  Falling back to npm view time for ${name}`)
      }
      const timeMap = npmViewTime(name, registry)
      if (timeMap) {
        meta = meta || {}
        meta.time = timeMap
        metaCache.set(name, meta)
      } else {
        unknownPublishDates.push({
          name,
          version,
          reason: 'Missing `time` in registry metadata and npm view fallback failed'
        })
        return
      }
    }

    const time = meta.time[lookupVersion]
    if (!time) {
      unknownPublishDates.push({
        name,
        version,
        reason: 'No publish time for this version in registry metadata'
      })
      return
    }

    // Convert publish timestamp to ms since epoch for age calculation.
    const publishedAt = Date.parse(time)
    if (!Number.isFinite(publishedAt)) {
      unknownPublishDates.push({ name, version, reason: `Unparseable publish time: ${time}` })
      return
    }

    const ageMs = now - publishedAt
    if (ageMs < minMs) {
      tooNew.push({
        name,
        version,
        publishedAt: new Date(publishedAt).toISOString(),
        ageDays: Math.floor(ageMs / (24 * 60 * 60 * 1000))
      })
    }
  }

  // 7) Concurrency-limited worker pool over the dependency list.
  async function worker() {
    while (true) {
      const i = cursor++
      if (i >= items.length) return
      const item = items[i]
      try {
        await checkDependency(item)
      } catch (e) {
        unknownPublishDates.push({
          name: item.name,
          version: item.version,
          reason: e.message || String(e)
        })
      }
    }
  }

  const workers = Array.from({ length: Math.min(maxConcurrent, items.length) }, () => worker())
  await Promise.all(workers)

  console.log('Finished checking dependency publish dates')

  // 8) Summarize unknowns/violations and exit non-zero on policy breach.
  // Report
  if (unknownPublishDates.length) {
    console.log(
      `\n⚠️  ${unknownPublishDates.length} dependencies had unknown publish dates (not counted as violations).`
    )

    const reasonCounts = getReasonCounts(unknownPublishDates)
    console.log('Top reasons:')
    for (const [reason, count] of reasonCounts.slice(0, 10)) {
      console.log(`  - ${count}x ${reason}`)
    }

    console.log('\nExamples:')
    for (const u of unknownPublishDates.slice(0, 20)) {
      console.log(`  - ${u.name}@${u.version} (${u.reason})`)
    }
    if (unknownPublishDates.length > 20)
      console.log(`  ...and ${unknownPublishDates.length - 20} more`)

    console.log('\nTip: try lowering concurrency, or validate only changes on PRs:')
    console.log('  node check-dep-age.js --mode changed --base-ref origin/main --concurrency 4')
    console.log('  node check-dep-age.js --registry "$(npm config get registry)" --concurrency 4')
  }

  if (args.failOnUnknown && unknownPublishDates.length) {
    console.error(
      `\n❌ Failing because --fail-on-unknown was set and ${unknownPublishDates.length} publish dates were unknown.`
    )
    console.error(
      'If these are expected (e.g., private packages), add them to --trusted or --ignore.'
    )
    process.exit(1)
  }

  if (tooNew.length) {
    tooNew.sort((a, b) => a.ageDays - b.ageDays)

    console.error(`\n❌ Dependency age policy violation(s): ${tooNew.length}`)
    console.error(`Minimum age: ${args.minDays} day(s)`)
    console.error(`Registry: ${registry}\n`)

    for (const v of tooNew.slice(0, 50)) {
      console.error(
        `- ${v.name}@${v.version} published ${v.publishedAt} (age ~${v.ageDays} day(s))`
      )
    }
    if (tooNew.length > 50) {
      console.error(`...and ${tooNew.length - 50} more`)
    }

    process.exit(1)
  }

  console.log(`✅ OK: all dependencies are at least ${args.minDays} day(s) old.`)
}

main().catch((e) => {
  console.error(`\n❌ dep-age-check failed: ${e && e.stack ? e.stack : e}`)
  process.exit(2)
})

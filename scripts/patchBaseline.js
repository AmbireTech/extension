#!/usr/bin/env node

/**
 * patchBaseline.js
 *
 * Runs `yarn extension:type:check-new` twice — once with
 * src/ambire-common/node_modules present and once without — then upserts
 * all third-party errors found in either run into .tsc-baseline.json.
 *
 * The double-run is necessary because tsc resolves some types differently
 * depending on whether ambire-common has its own node_modules. Both states
 * are valid for the project, so the baseline needs to cover both.
 *
 * Requires src/ambire-common/node_modules to be present — run
 * Please install node_modules in src/ambire-common before running this script.
 *
 * Usage: node scripts/patchBaseline.js
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Errors whose file path matches any of these strings will be patched.
// Extend this list when new unfixable third-party packages cause noise.
const NODE_MODULES_MARKERS = ['node_modules/']

const BASELINE_PATH = path.resolve('.tsc-baseline.json')
const AMBIRE_NODE_MODULES = path.resolve('src/ambire-common/node_modules')
const AMBIRE_NODE_MODULES_TMP = path.resolve('src/ambire-common/node_modules_tmp_baseline')

// ---------------------------------------------------------------------------

// Splits the command output into per-error blocks and extracts structured data.
// Expected block format (produced by the type-check script):
//
//   File: <path>
//   Message: <message>
//   Code: <TS code>
//   Hash: <sha1>
//   Count of new errors: <n>
//   <n> current error:
//   <location lines>
function parseOutput(output) {
  const errors = []
  const blocks = output.split(/(?=^File:)/m)

  for (const block of blocks) {
    const fileMatch = block.match(/^File:\s*(.+)$/m)
    const msgMatch = block.match(/^Message:\s*(.+)$/m)
    const codeMatch = block.match(/^Code:\s*(\S+)$/m)
    const hashMatch = block.match(/^Hash:\s*([0-9a-f]+)$/m)
    const countMatch = block.match(/^Count of new errors:\s*(\d+)$/m)

    if (!fileMatch || !hashMatch) continue

    errors.push({
      hash: hashMatch[1].trim(),
      file: fileMatch[1].trim(),
      code: codeMatch ? codeMatch[1].trim() : '',
      message: msgMatch ? msgMatch[1].trim() : '',
      count: countMatch ? parseInt(countMatch[1], 10) : 1
    })
  }

  return errors
}

function isThirdPartyError(err) {
  return NODE_MODULES_MARKERS.some((marker) => err.file.includes(marker))
}

function runCheck(label) {
  console.log(`\nRunning type check (${label}) …`)
  let output = ''
  try {
    output = execSync('yarn extension:type:check-new', {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']
    })
  } catch (err) {
    // Non-zero exit is normal when new errors are found.
    output = (err.stdout || '') + (err.stderr || '')
  }
  console.log(output)
  return parseOutput(output).filter(isThirdPartyError)
}

function loadBaseline(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`Baseline not found at ${filePath} – starting fresh.`)
    return { errors: {} }
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function saveBaseline(filePath, baseline) {
  fs.writeFileSync(filePath, JSON.stringify(baseline, null, 2) + '\n', 'utf8')
}

// Finds an existing baseline entry that matches on file + code.
// We match on both so that two different errors in the same file are treated
// as separate entries.
function findExistingKey(errorsMap, newEntry) {
  for (const [key, entry] of Object.entries(errorsMap)) {
    if (entry.file === newEntry.file && entry.code === newEntry.code) {
      return key
    }
  }
  return null
}

// Merges errors from multiple runs, keyed by file+code so duplicates
// (same error found in both states) are deduplicated. Last write wins on
// hash, which is fine — if the hash differs between runs for the same
// logical error, that's a sign the baseline needs both states covered and
// the second run's hash is as valid as the first.
function mergeErrors(runs) {
  const seen = new Map()
  for (const errors of runs) {
    for (const err of errors) {
      seen.set(`${err.file}::${err.code}`, err)
    }
  }
  return [...seen.values()]
}

// ---------------------------------------------------------------------------

function main() {
  if (!fs.existsSync(AMBIRE_NODE_MODULES)) {
    console.error(`Error: ${AMBIRE_NODE_MODULES} not found.`)
    console.error('Run `yarn` inside src/ambire-common before running this script.')
    process.exit(1)
  }

  // Run 1: with ambire-common/node_modules present
  const errorsWithNodeModules = runCheck('with ambire-common/node_modules')

  // Run 2: without — rename the directory out of the way and restore it afterwards
  let errorsWithoutNodeModules = []
  try {
    fs.renameSync(AMBIRE_NODE_MODULES, AMBIRE_NODE_MODULES_TMP)
    errorsWithoutNodeModules = runCheck('without ambire-common/node_modules')
  } finally {
    // Always restore, even if runCheck throws.
    if (fs.existsSync(AMBIRE_NODE_MODULES_TMP)) {
      fs.renameSync(AMBIRE_NODE_MODULES_TMP, AMBIRE_NODE_MODULES)
    }
  }

  const allThirdPartyErrors = mergeErrors([errorsWithNodeModules, errorsWithoutNodeModules])

  if (allThirdPartyErrors.length === 0) {
    console.log('\nNo third-party errors found in either run. Baseline unchanged.')
    return
  }

  console.log(`\nPatching ${allThirdPartyErrors.length} third-party error(s) into baseline.`)

  const baseline = loadBaseline(BASELINE_PATH)
  if (!baseline.errors) baseline.errors = {}

  for (const err of allThirdPartyErrors) {
    const existingKey = findExistingKey(baseline.errors, err)

    if (existingKey) {
      if (existingKey === err.hash) {
        console.log(`  (unchanged) ${err.file} ${err.code}`)
        continue
      }
      console.log(`  (updated)   ${err.file} ${err.code}  ${existingKey} → ${err.hash}`)
      delete baseline.errors[existingKey]
    } else {
      console.log(`  (added)     ${err.file} ${err.code}  ${err.hash}`)
    }

    baseline.errors[err.hash] = {
      file: err.file,
      code: err.code,
      count: err.count,
      message: err.message
    }
  }

  saveBaseline(BASELINE_PATH, baseline)
  console.log(`\nBaseline saved to ${BASELINE_PATH}`)
}

main()

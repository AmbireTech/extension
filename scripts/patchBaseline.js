#!/usr/bin/env node

/**
 * patchBaseline.js
 *
 * Runs `yarn extension:type:check-new` and upserts any errors originating
 * from node_modules into .tsc-baseline.json.
 *
 * By default only node_modules errors are patched because those come from
 * third-party code we can't fix. Add more patterns to NODE_MODULES_MARKERS
 * if new problematic packages appear.
 *
 * Usage: node scripts/patchBaseline.js
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Errors whose file path matches any of these strings will be patched.
// Extend this list when new unfixable third-party packages appear.
const NODE_MODULES_MARKERS = ['node_modules/ox', 'node_modules/viem']

const BASELINE_PATH = path.resolve('.tsc-baseline.json')

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

// ---------------------------------------------------------------------------

function main() {
  console.log('Running yarn extension:type:check-new …')
  let output = ''
  try {
    output = execSync('yarn extension:type:check-new', {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']
    })
  } catch (err) {
    // Non-zero exit is normal when the command finds new errors.
    output = (err.stdout || '') + (err.stderr || '')
  }

  console.log('\n── Command output ──────────────────────────────────────────')
  console.log(output)
  console.log('────────────────────────────────────────────────────────────\n')

  const thirdPartyErrors = parseOutput(output).filter(isThirdPartyError)

  if (thirdPartyErrors.length === 0) {
    console.log('No third-party errors found. Baseline unchanged.')
    return
  }

  console.log(`Found ${thirdPartyErrors.length} third-party error(s) to patch.`)

  const baseline = loadBaseline(BASELINE_PATH)
  if (!baseline.errors) baseline.errors = {}

  for (const err of thirdPartyErrors) {
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

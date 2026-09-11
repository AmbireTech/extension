/* eslint-disable @typescript-eslint/no-require-imports */
// Removes a build output folder before a fresh build. A plain `rm -rf ./build/<name>`
// can't be used, because BUILD_DIR lives in .env and the shell doesn't read it.
// Usage: node scripts/clean-build-output.js webkit-dev
const fs = require('fs')
const path = require('path')
const { buildDir } = require('../webpack/env')

const outputPath = process.argv[2]

if (!outputPath) {
  console.error(
    'Error: pass the build output folder name, e.g. node scripts/clean-build-output.js webkit-dev'
  )
  process.exit(1)
}

fs.rmSync(path.join(buildDir, outputPath), { recursive: true, force: true })

/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Downloads the Tornado Cash proving artifacts (~34 MB) that the extension serves same-origin, the
 * same way it ships the Privacy Pools circuits. They are not on npm, so they come from a pinned
 * tornado-cli commit and are checked against fixed SHA-256 hashes: a tampered proving key can
 * break the proofs' zero-knowledge. Run by `yarn setup`; webpack checks the hashes again on copy.
 */
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const TORNADO_CLI_COMMIT = '378ddf8b8b92a4924037d7b64a94dbfd5a7dd6e8'

/** Where the artifacts are cached, and copied from by webpack/extension.js. */
const TORNADO_CASH_ARTIFACTS_DIR = path.resolve(
  __dirname,
  '../node_modules/.cache/tornado-cash-artifacts'
)

/** Filenames must match TORNADO_CASH_ARTIFACT_PATHS in ambire-common. */
const TORNADO_CASH_ARTIFACTS = {
  'tornado.json': '3ddd61dbff09caeec82d8edde95c674a3c34f9e66b1fe9f2c8783e72fe536f98',
  'tornadoProvingKey.bin': '8e2d2f22beafb5a9666daebca57b13f8029c3656c65fcfbcc86e2418fa16a3af'
}

const sha256 = (content) => crypto.createHash('sha256').update(content).digest('hex')

/** Throws unless `content` is exactly the pinned artifact `fileName`. */
const assertTornadoCashArtifact = (fileName, content) => {
  const expectedHash = TORNADO_CASH_ARTIFACTS[fileName]
  if (!expectedHash) throw new Error(`Unknown Tornado Cash artifact: ${fileName}`)

  const actualHash = sha256(content)
  if (actualHash !== expectedHash)
    throw new Error(
      `Tornado Cash artifact ${fileName} has hash ${actualHash}, expected ${expectedHash}`
    )
}

const isCached = (fileName) => {
  const filePath = path.join(TORNADO_CASH_ARTIFACTS_DIR, fileName)
  if (!fs.existsSync(filePath)) return false

  try {
    assertTornadoCashArtifact(fileName, fs.readFileSync(filePath))
    return true
  } catch (error) {
    console.warn(`${error.message}. Downloading it again.`)
    return false
  }
}

const download = async (fileName) => {
  const url = `https://raw.githubusercontent.com/tornadocash/tornado-cli/${TORNADO_CLI_COMMIT}/build/circuits/${fileName}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Downloading ${url} failed with status ${response.status}`)

  const content = Buffer.from(await response.arrayBuffer())
  assertTornadoCashArtifact(fileName, content)

  // Written next to the target and renamed, so an interrupted download never looks cached
  const filePath = path.join(TORNADO_CASH_ARTIFACTS_DIR, fileName)
  fs.writeFileSync(`${filePath}.download`, content)
  fs.renameSync(`${filePath}.download`, filePath)
}

const fetchTornadoCashArtifacts = async () => {
  fs.mkdirSync(TORNADO_CASH_ARTIFACTS_DIR, { recursive: true })

  for (const fileName of Object.keys(TORNADO_CASH_ARTIFACTS)) {
    if (isCached(fileName)) continue

    console.log(`Downloading the Tornado Cash artifact ${fileName}...`)
    await download(fileName)
  }
}

if (require.main === module) {
  fetchTornadoCashArtifacts().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

module.exports = { TORNADO_CASH_ARTIFACTS_DIR, assertTornadoCashArtifact }

/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * The Tornado Cash circuit is a circom 1 JSON whose templates are JS source. The SDK's witness
 * generator (micro-zk-proofs@0.3.1, bundled in `state-manager.worker.js`) compiles them with
 * `new Function`, which the extension's CSP forbids (MV3 never allows 'unsafe-eval'). The circuit
 * is pinned, so its templates are compiled here at build time instead and the worker looks them up.
 */
const fs = require('fs')
const path = require('path')

const { TORNADO_CASH_ARTIFACTS_DIR } = require('./fetch-tornado-cash-artifacts')

// Copied from micro-zk-proofs@0.3.1 `witness.js`: turns a template into the generator it runs
const ctxYieldCall = /(^|[^\w$.])(ctx\.(?:callFunction|setPin|setSignal)\()/g
const jsIgnored =
  /("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`|\/\/[^\n\r]*(?:\r\n?|\n|$)|\/\*[\s\S]*?\*\/)/g
const yieldCtxCalls = (src) => {
  const code = (chunk) => chunk.replace(ctxYieldCall, '$1yield $2')
  let out = ''
  let last = 0
  for (const match of src.matchAll(jsIgnored)) {
    out += code(src.slice(last, match.index)) + match[0]
    last = match.index + match[0].length
  }
  return out + code(src.slice(last))
}
const codeToGenerator = (src) =>
  yieldCtxCalls(src.replace(/function\s*\(\s*ctx\s*\)\s*\{/, 'function*(ctx) {'))

const WITNESS_TABLE_NAME = '__TORNADO_CASH_WITNESS__'

/** The worker's two `new Function` calls, each replaced by a lookup in the precompiled table. */
const REPLACEMENTS = [
  {
    from: 'new Function("bigInt", "__P__", "__MASK__", "return " + codeToGenerator(circJson.templates[t]))',
    to: `${WITNESS_TABLE_NAME}.templates[t]`
  },
  {
    from: 'new Function("bigInt", "__P__", "__MASK__", "return " + codeToGenerator(circJson.functions[f].func))',
    to: `${WITNESS_TABLE_NAME}.functions[f]`
  }
]

/** The same factory `new Function` builds, called by the worker with (BigInt, P, MASK). */
const toFactorySource = (templateSource) =>
  `function (bigInt, __P__, __MASK__) { return ${codeToGenerator(templateSource)}\n}`

const toTableSource = (entries) =>
  `{${entries
    .map(([name, source]) => `${JSON.stringify(name)}: ${toFactorySource(source)}`)
    .join(',\n')}}`

/**
 * Returns `workerSource` with the circuit's templates precompiled into it and no `new Function`.
 * Throws if the worker no longer has exactly the expected calls, e.g. after an SDK upgrade.
 */
const precompileTornadoCashWitness = (workerSource) => {
  const circuit = JSON.parse(
    fs.readFileSync(path.join(TORNADO_CASH_ARTIFACTS_DIR, 'tornado.json'), 'utf8')
  )

  const patchedSource = REPLACEMENTS.reduce((source, { from, to }) => {
    const parts = source.split(from)
    if (parts.length !== 2)
      throw new Error(
        `Tornado Cash worker: expected one "${from}", found ${parts.length - 1}. Was the SDK upgraded?`
      )
    return parts.join(to)
  }, workerSource)

  if (patchedSource.includes('new Function('))
    throw new Error('Tornado Cash worker: a `new Function` call is left, which the CSP blocks')

  const table = `var ${WITNESS_TABLE_NAME} = {
templates: ${toTableSource(Object.entries(circuit.templates))},
functions: ${toTableSource(Object.entries(circuit.functions).map(([name, { func }]) => [name, func]))}
};
`

  return table + patchedSource
}

module.exports = { precompileTornadoCashWitness }

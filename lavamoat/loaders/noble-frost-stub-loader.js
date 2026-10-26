/**
 * Replaces @noble/curves' unused FROST module (threshold signatures) with a stub.
 *
 * ed25519.js, secp256k1.js, nist.js and ed448.js call `createFROST` on load, so it can't be
 * tree-shaken. It (and fft.js, imported only by it) has `eval` as a method name, which LavaMoat's
 * direct-eval rewrite turns into invalid JS. The stub keeps the export and throws only on use.
 *
 * Remove once LavaMoat stops rewriting `eval` names that aren't calls:
 * https://github.com/LavaMoat/LavaMoat/issues/2122
 */
module.exports = function nobleFrostStubLoader() {
  return `
const throwNotBundled = () => {
  throw new Error('FROST threshold signatures from @noble/curves are not included in this build')
}

export function createFROST() {
  return new Proxy(
    {},
    { get: (_, key) => (typeof key === 'string' && key !== 'then' ? throwNotBundled() : undefined) }
  )
}
`
}

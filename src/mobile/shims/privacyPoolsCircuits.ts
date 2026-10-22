/**
 * Mobile replacement for `@fatsolutions/privacy-pools-core-circuits`, wired in by a Metro
 * resolver redirect (see metro.config.js).
 *
 * The real package proves with snarkjs. Metro resolves snarkjs to its Node build, which requires
 * Node built-ins (`readline`, `fs`, `os`) that the native bundle cannot resolve, and proving needs
 * WebAssembly, which Hermes has no support for. Mobile has no Privacy Pools support yet, so this
 * only lets the controllers that import the package bundle. `Prover` is all that they and the
 * Privacy Pools SDK import, and it fails with the real reason instead of a missing module.
 */
export const Prover = (): Promise<never> =>
  Promise.reject(new Error('privacyPools: proving is not available on mobile yet'))

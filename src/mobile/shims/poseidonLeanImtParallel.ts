/**
 * Mobile replacement for `@kohaku-eth/poseidon-lean-imt`'s parallel tree build, wired in by a
 * Metro resolver redirect (see metro.config.js).
 *
 * The original starts Web Workers or `node:worker_threads` through `import.meta.url` and
 * `import()` of a computed name, neither of which Metro and Hermes can bundle. React Native has
 * neither kind of worker anyway, so Privacy Pools' `buildMerkleTree` never asks for a parallel
 * build there, and builds its trees on one thread if it ever does and this throws.
 */
export const MAX_DEFAULT_WORKERS = 1

export const defaultWorkerCount = async (): Promise<number> => MAX_DEFAULT_WORKERS

export const parallelLevels = async (): Promise<bigint[][]> => {
  throw new Error('privacyPools: Merkle trees cannot be built on workers on mobile')
}

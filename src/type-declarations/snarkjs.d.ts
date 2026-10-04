/**
 * snarkjs ships no types. Only what the Privacy Pools prover document calls directly is declared -
 * proving itself goes through `@fatsolutions/privacy-pools-core-circuits`.
 */
declare module 'snarkjs' {
  /** Named by `@fatsolutions/privacy-pools-core-circuits`' own types, so it has to exist here. */
  export type Groth16Proof = {
    pi_a: string[]
    pi_b: string[][]
    pi_c: string[]
    protocol: string
    curve: string
  }

  export const curves: {
    /**
     * Builds the curve, and with it ffjavascript's worker threads, or returns the one already
     * built. Proving reuses it.
     */
    getCurveFromName: (name: string, options?: { singleThread?: boolean }) => Promise<unknown>
  }
}

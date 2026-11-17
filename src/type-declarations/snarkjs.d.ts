/** snarkjs ships no types. Declares only what the Privacy Pools prover document calls. */
declare module 'snarkjs' {
  /** Referenced by `@fatsolutions/privacy-pools-core-circuits`' types. */
  export type Groth16Proof = {
    pi_a: string[]
    pi_b: string[][]
    pi_c: string[]
    protocol: string
    curve: string
  }

  export const curves: {
    /** Builds the curve and ffjavascript's worker threads, or returns the cached one. */
    getCurveFromName: (name: string, options?: { singleThread?: boolean }) => Promise<unknown>
  }
}

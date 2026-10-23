/**
 * Chains where the PQ1 smart-wallet factory is deployed (same CREATE2 address
 * everywhere). Shared by the web signer (which refuses other chains) and the
 * dapp provider (which reports PQ1 capabilities per chain).
 */
export const PQ1_SUPPORTED_CHAIN_IDS: readonly number[] = [1, 8453, 84532]

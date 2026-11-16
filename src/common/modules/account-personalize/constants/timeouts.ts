/**
 * How long Proceed waits for adding to reply. Adding writes the accounts and keys, and the smart
 * accounts' identities are created on the Relayer, which can take a while on a slow connection -
 * so it gets more room than the default.
 */
export const ADD_ACCOUNTS_TIMEOUT_MS = 60_000

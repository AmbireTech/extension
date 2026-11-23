// A PQ1 account can approve a Safe transaction onchain, with a call to the Safe's `approveHash`
// (e.g. when an app asks it to). To show what it approves, `pq1-sdk` fetches that Safe
// transaction from the Safe API, which the user can opt out of ("Sync Safe accounts" in the
// privacy settings). Signing a Safe transaction as an owner doesn't need it, as the typed data
// carries the whole transaction.

import { Interface } from 'ethers'

const SAFE_APPROVE_HASH_SELECTOR = new Interface([
  'function approveHash(bytes32 hashToApprove)'
]).getFunction('approveHash')!.selector

/** Shown when a PQ1 account is asked to approve a Safe transaction while sync is off. */
export const PQ1_SAFE_APPROVAL_NEEDS_SYNC_MESSAGE =
  'Your PQ1 can\'t approve this Safe transaction while "Sync Safe accounts" is turned off, as it gets the transaction\'s details through it. Turn it on in the privacy settings and try again.'

/**
 * Whether the call approves a Safe transaction, which the PQ1 can only show with the Safe API.
 * Compares the first 4 bytes as text, so malformed call data never throws here.
 */
export const isSafeApproveHashCall = (data: string | undefined): boolean =>
  !!data &&
  data.slice(0, SAFE_APPROVE_HASH_SELECTOR.length).toLowerCase() ===
    SAFE_APPROVE_HASH_SELECTOR.toLowerCase()

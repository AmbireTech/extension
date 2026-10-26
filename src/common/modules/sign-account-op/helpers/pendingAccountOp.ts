import { AccountOp, getAccountOpNonce } from '@ambire-common/libs/accountOp/accountOp'
import { SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import { collapseReplacedAccountOps } from '@ambire-common/libs/activity/replacements'

type Params = {
  /** The transaction being signed */
  accountOp: AccountOp
  isSafeAccount: boolean
  /** The account's nonce from its latest known state on the transaction's network */
  accountStateNonce: bigint | undefined
  /** The account's transactions that were sent but aren't confirmed yet (any network) */
  pendingAccountOps: SubmittedAccountOp[]
}

/**
 * A Safe transaction is held back by a pending one with a lower Safe nonce. One below the Safe's
 * nonce can never be confirmed, as its nonce was already used, so it holds nothing back. The
 * earliest one is returned, as it holds back every transaction after it
 */
const getEarliestPendingSafeAccountOp = ({
  accountOp,
  accountStateNonce,
  pendingAccountOps
}: Omit<Params, 'isSafeAccount'>): SubmittedAccountOp | null => {
  const currentNonce = getAccountOpNonce(accountOp)
  if (currentNonce === null) return null
  const onchainNonce = accountStateNonce ?? 0n

  return pendingAccountOps.reduce<SubmittedAccountOp | null>((earliest, submittedAccountOp) => {
    if (
      submittedAccountOp.chainId !== accountOp.chainId ||
      submittedAccountOp.nonce === null ||
      submittedAccountOp.nonce < onchainNonce ||
      submittedAccountOp.nonce >= currentNonce
    )
      return earliest

    return !earliest || earliest.nonce === null || submittedAccountOp.nonce < earliest.nonce
      ? submittedAccountOp
      : earliest
  }, null)
}

/**
 * Any other account (an EOA, a 7702 EOA or an Ambire smart account) sends its transactions one
 * after another, so every pending one on the same network goes through first. Their nonces
 * can't be compared, as each way of sending stores a different one (the EOA's, the account's
 * or the bundler's), so the earliest is the first one sent. The pending transaction the one
 * being signed replaces (a speed up or a cancel) is skipped, and so is the transaction itself,
 * which shows up as pending right after it's sent
 */
const getEarliestPendingNonSafeAccountOp = ({
  accountOp,
  pendingAccountOps
}: Pick<Params, 'accountOp' | 'pendingAccountOps'>): SubmittedAccountOp | null => {
  const replacedIdentifier = accountOp.meta?.speedUp?.replacedIdentifiedBy?.identifier

  return pendingAccountOps.reduce<SubmittedAccountOp | null>((earliest, submittedAccountOp) => {
    if (
      submittedAccountOp.chainId !== accountOp.chainId ||
      submittedAccountOp.id === accountOp.id ||
      (!!replacedIdentifier && submittedAccountOp.identifiedBy.identifier === replacedIdentifier)
    )
      return earliest

    return !earliest || submittedAccountOp.timestamp < earliest.timestamp
      ? submittedAccountOp
      : earliest
  }, null)
}

/**
 * The earliest transaction that was already sent from the account but isn't confirmed yet, and
 * has to go through before the one being signed can. Null if nothing holds it back.
 * A pending transaction and its speed ups replace each other, so only the newest of them is
 * considered, as the activity shows it: it pays the highest fee, so speeding up or cancelling
 * must outbid it, and the older ones never hold anything back on their own
 */
export const getEarliestPendingAccountOp = ({
  isSafeAccount,
  pendingAccountOps,
  ...params
}: Params) => {
  const latestPendingAccountOps = collapseReplacedAccountOps(pendingAccountOps)

  return isSafeAccount
    ? getEarliestPendingSafeAccountOp({ ...params, pendingAccountOps: latestPendingAccountOps })
    : getEarliestPendingNonSafeAccountOp({ ...params, pendingAccountOps: latestPendingAccountOps })
}

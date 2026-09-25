import { useMemo } from 'react'

import useController from '@common/hooks/useController'

/**
 * Tells which recovery phrases the user still has to write down.
 *
 * The settings screen lists every phrase that was never backed up, so the user always has
 * a way in. The dashboard banner is stricter and only appears once the account holds funds -
 * there is nothing to lose before that, and nagging users with empty accounts defeats the
 * point of the simplified onboarding. A Privacy Pools account is the exception: the phrase is
 * all there is to it, so it is asked for from the start.
 */
export default function useRecoveryPhraseBackupStatus() {
  const { seeds, keys } = useController('KeystoreController').state
  const {
    state: { account: selectedAccount, portfolio, privacyPoolsAccountId }
  } = useController('SelectedAccountController')

  const notBackedUpSeedIds = useMemo(
    () => seeds.filter(({ notBackedUp }) => notBackedUp).map(({ id }) => id),
    [seeds]
  )

  // Phrases awaiting a backup come first, so the user doesn't have to scroll past
  // long lists of accounts to find out that one of their phrases is at risk.
  const seedsSortedByBackupStatus = useMemo(
    () => [...seeds].sort((a, b) => Number(!!b.notBackedUp) - Number(!!a.notBackedUp)),
    [seeds]
  )

  const seedIdOfSelectedAccountNeedingBackup = useMemo(() => {
    // Identified by its recovery phrase, so it is that phrase
    if (privacyPoolsAccountId)
      return notBackedUpSeedIds.includes(privacyPoolsAccountId) ? privacyPoolsAccountId : null

    if (!selectedAccount || portfolio.totalBalance <= 0) return null

    const selectedAccountKeyAddrs = selectedAccount.associatedKeys
    const seedIdOfSelectedAccount = keys.find(
      ({ addr, meta }) => !!meta.fromSeedId && selectedAccountKeyAddrs.includes(addr)
    )?.meta.fromSeedId

    if (!seedIdOfSelectedAccount) return null

    return notBackedUpSeedIds.includes(seedIdOfSelectedAccount) ? seedIdOfSelectedAccount : null
  }, [keys, notBackedUpSeedIds, portfolio.totalBalance, privacyPoolsAccountId, selectedAccount])

  return { notBackedUpSeedIds, seedsSortedByBackupStatus, seedIdOfSelectedAccountNeedingBackup }
}

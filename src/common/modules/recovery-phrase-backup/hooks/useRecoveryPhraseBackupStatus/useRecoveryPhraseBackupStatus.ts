import { useMemo } from 'react'

import useController from '@common/hooks/useController'

/**
 * Tells which recovery phrases the user still has to write down.
 *
 * The settings screen lists every phrase that was never backed up, so the user always has
 * a way in. The dashboard banner is stricter and only appears once the account holds funds -
 * there is nothing to lose before that, and nagging users with empty accounts defeats the
 * point of the simplified onboarding.
 */
export default function useRecoveryPhraseBackupStatus() {
  const { seeds, keys } = useController('KeystoreController').state
  const {
    state: { account: selectedAccount, portfolio }
  } = useController('SelectedAccountController')

  const notBackedUpSeedIds = useMemo(
    () => seeds.filter(({ notBackedUp }) => notBackedUp).map(({ id }) => id),
    [seeds]
  )

  const seedIdOfSelectedAccountNeedingBackup = useMemo(() => {
    if (!selectedAccount || portfolio.totalBalance <= 0) return null

    const selectedAccountKeyAddrs = selectedAccount.associatedKeys
    const seedIdOfSelectedAccount = keys.find(
      ({ addr, meta }) => !!meta.fromSeedId && selectedAccountKeyAddrs.includes(addr)
    )?.meta.fromSeedId

    if (!seedIdOfSelectedAccount) return null

    return notBackedUpSeedIds.includes(seedIdOfSelectedAccount) ? seedIdOfSelectedAccount : null
  }, [keys, notBackedUpSeedIds, portfolio.totalBalance, selectedAccount])

  return { notBackedUpSeedIds, seedIdOfSelectedAccountNeedingBackup }
}

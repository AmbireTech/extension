import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { AMBIRE_ACCOUNT_FACTORY } from '@ambire-common/consts/deploy'
import { Account } from '@ambire-common/interfaces/account'
import { canBecomeSmarter, isSmartAccount } from '@ambire-common/libs/account/account'
import { getIsViewOnly } from '@ambire-common/utils/accounts'
import useController from '@common/hooks/useController'

const useHasGasTank = ({ account }: { account: Account | null }) => {
  const { t } = useTranslation()
  const { keys } = useController('KeystoreController').state

  const isViewOnly = useMemo(
    () => account && getIsViewOnly(keys, account.associatedKeys),
    [account, keys]
  )

  const getAccKeys = useCallback(
    (acc: any) => keys.filter((key) => acc?.associatedKeys.includes(key.addr)),
    [keys]
  )

  const canUseGasTank = useMemo(() => {
    if (!account) return false

    if (account.safeCreation) return false // not available for Safe accounts

    // not available for v1 accounts
    // one could argue if checking the factoryAddr is the best approach for this
    // but the alternative is checking the account state (onchain metric),
    // causing this simple component to become needlessly more diffucult.
    // Collateral damage might become old v2 SAs we used for testing that
    // are already deprecated and chances are the gas tank doesn't work there
    // so it's better to disable it for them as well
    if (account.creation && account.creation.factoryAddr !== AMBIRE_ACCOUNT_FACTORY) return false

    if (isViewOnly) return true // assume view only accounts CAN use Gas Tank, not knowing their key types yet

    return isSmartAccount(account) || canBecomeSmarter(account, getAccKeys(account))
  }, [account, getAccKeys, isViewOnly])

  const disabledReason = useMemo(() => {
    if (canUseGasTank) return ''

    if (account?.safeCreation) return t('Not available for Safe wallets, yet.')

    if (account?.creation)
      return t(
        'This feature is no longer available for Ambire v1 accounts and other legacy Ambire smart accounts.'
      )

    const hasTrezorKey = getAccKeys(account).some((key) => key.type === 'trezor')
    const hasLedgerKey = getAccKeys(account).some((key) => key.type === 'ledger')
    const hasQrBasedKey = getAccKeys(account).some((key) => key.type === 'qr')

    const typesOfKeys = []
    if (hasTrezorKey) typesOfKeys.push(t('Trezor'))
    if (hasLedgerKey) typesOfKeys.push(t('Ledger'))
    if (hasQrBasedKey) typesOfKeys.push(t('QR-based'))

    return t(
      "Not available for {{typesOfKey}} wallets yet. Requires EIP-7702 (that enables EOAs to gain smart account capabilities) which these devices don't support yet.",
      {
        typesOfKey: typesOfKeys.join(` ${t('and')} `),
        who: typesOfKeys.length > 1 ? t("they don't") : (typesOfKeys[0] ?? t('these'))
      }
    )
  }, [account, canUseGasTank, getAccKeys, t])

  return { canUseGasTank, isViewOnly, disabledReason }
}

export default useHasGasTank

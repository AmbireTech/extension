import { useMemo } from 'react'
import { View } from 'react-native'

import { isSmartAccount as getIsSmartAccount } from '@ambire-common/libs/account/account'
import { getIsViewOnly } from '@ambire-common/utils/accounts'
import Alert from '@common/components/Alert'
import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import flexbox from '@common/styles/utils/flexbox'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

/**
 * Hook that provides encryption capability validation logic.
 * Used for screens that require internal keys for encryption/decryption operations.
 */
export const useEncryptionCapability = () => {
  const { t } = useTranslation()
  const { account } = useSelectedAccountControllerState()
  const keystoreState = useKeystoreControllerState()

  const isViewOnly = getIsViewOnly(keystoreState.keys, account?.associatedKeys || [])
  const isSmartAccount = getIsSmartAccount(account)

  const selectedAccountKeyStoreKeys = useMemo(
    () => keystoreState.keys.filter((key) => account?.associatedKeys.includes(key.addr)),
    [keystoreState.keys, account?.associatedKeys]
  )

  const internalKey = useMemo(
    () => selectedAccountKeyStoreKeys.find((k) => k.type === 'internal'),
    [selectedAccountKeyStoreKeys]
  )

  const errorNode = useMemo(() => {
    if (isSmartAccount)
      return (
        <Alert
          title={<Text>{t('Smart contract wallets do not support this capability.')}</Text>}
          type="error"
        />
      )

    const hasKeyButNotAnInternalOne = !isViewOnly && !internalKey
    if (hasKeyButNotAnInternalOne)
      return (
        <Alert
          title={<Text>{t('Hardware wallets do not support this capability.')}</Text>}
          type="error"
        />
      )

    return null
  }, [internalKey, isSmartAccount, isViewOnly, t])

  const actionFooterResolveNode = useMemo(() => {
    if (isSmartAccount || internalKey) return null

    if (isViewOnly)
      return (
        <View style={[{ flex: 3 }, flexbox.directionRow, flexbox.justifyEnd]}>
          <NoKeysToSignAlert type="short" isTransaction={false} />
        </View>
      )

    return null
  }, [isSmartAccount, isViewOnly, internalKey])

  const isDisabled = isViewOnly || isSmartAccount || !internalKey

  return {
    internalKey,
    selectedAccountKeyStoreKeys,
    errorNode,
    actionFooterResolveNode,
    isDisabled
  }
}

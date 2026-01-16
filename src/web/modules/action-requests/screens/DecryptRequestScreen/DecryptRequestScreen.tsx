import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { isSmartAccount as getIsSmartAccount } from '@ambire-common/libs/account/account'
import { getIsViewOnly } from '@ambire-common/utils/accounts'
import Alert from '@common/components/Alert'
import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import RequestingDappInfo from '@web/components/RequestingDappInfo'
import SmallNotificationWindowWrapper from '@web/components/SmallNotificationWindowWrapper'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useDappInfo from '@web/hooks/useDappInfo'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import ActionFooter from '@web/modules/action-requests/components/ActionFooter'

const DecryptRequestScreen = () => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { currentUserRequest } = useRequestsControllerState()
  const { account } = useSelectedAccountControllerState()
  const keystoreState = useKeystoreControllerState()
  const { theme, themeType } = useTheme()

  const userRequest = useMemo(
    () => (currentUserRequest?.kind === 'ethDecrypt' ? currentUserRequest : undefined),
    [currentUserRequest]
  )

  const { name, icon } = useDappInfo(userRequest)

  const selectedAccountKeyStoreKeys = useMemo(
    () => keystoreState.keys.filter((key) => account?.associatedKeys.includes(key.addr)),
    [keystoreState.keys, account?.associatedKeys]
  )

  const handleDecrypt = useCallback(() => {
    if (!userRequest) return

    if (!selectedAccountKeyStoreKeys.length) return

    const internalKey = selectedAccountKeyStoreKeys.find((k) => k.type === 'internal')
    if (!internalKey) return

    dispatch({
      type: 'MAIN_CONTROLLER_HANDLE_DECRYPT',
      params: {
        encryptedData: currentUserRequest?.meta?.params[0],
        requestId: userRequest.id,
        keyAddr: internalKey.addr,
        keyType: internalKey.type
      }
    })
  }, [userRequest, dispatch, selectedAccountKeyStoreKeys, currentUserRequest])

  // Duplicated with GetEncryptionPublicKeyRequestScreen
  const isViewOnly = getIsViewOnly(keystoreState.keys, account?.associatedKeys || [])
  const isSmartAccount = getIsSmartAccount(account)
  const internalKey = selectedAccountKeyStoreKeys.find((k) => k.type === 'internal')
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

  const handleDeny = useCallback(() => {
    if (!userRequest) return

    dispatch({
      type: 'REQUESTS_CONTROLLER_REJECT_USER_REQUEST',
      params: { err: t('User rejected the request.'), id: userRequest.id }
    })
  }, [userRequest, t, dispatch])

  // TODO: Display not supported for 1) smart accounts and 2) accounts with only hw wallet keys.
  return (
    <SmallNotificationWindowWrapper>
      <TabLayoutContainer
        width="full"
        header={
          <HeaderAccountAndNetworkInfo
            backgroundColor={
              themeType === THEME_TYPES.DARK
                ? (theme.secondaryBackground as string)
                : (theme.primaryBackground as string)
            }
          />
        }
        footer={
          <ActionFooter
            onReject={handleDeny}
            onResolve={handleDecrypt}
            resolveButtonText={t('Decrypt')}
            resolveDisabled={isViewOnly || isSmartAccount}
            resolveButtonTestID="button-decrypt"
            resolveNode={actionFooterResolveNode}
          />
        }
        backgroundColor={theme.quinaryBackground}
      >
        <TabLayoutWrapperMainContent>
          <RequestingDappInfo
            name={name}
            icon={icon}
            intentText={t('wants you to decrypt a message')}
          />

          <View style={[spacings.mtLg, flexbox.flex1, flexbox.justifySpaceBetween]}>
            <Text>TODO: Display the message.</Text>

            {errorNode}
          </View>
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    </SmallNotificationWindowWrapper>
  )
}

export default React.memo(DecryptRequestScreen)

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

const GetEncryptionPublicKeyRequestScreen = () => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { currentUserRequest } = useRequestsControllerState()
  const { account } = useSelectedAccountControllerState()
  const keystoreState = useKeystoreControllerState()
  const { theme, themeType } = useTheme()

  const userRequest = useMemo(
    () =>
      currentUserRequest?.kind === 'ethGetEncryptionPublicKey' ? currentUserRequest : undefined,
    [currentUserRequest]
  )

  const { name, icon } = useDappInfo(userRequest)

  const isViewOnly = getIsViewOnly(keystoreState.keys, account?.associatedKeys || [])
  const isSmartAccount = getIsSmartAccount(account)

  const selectedAccountKeyStoreKeys = useMemo(
    () => keystoreState.keys.filter((key) => account?.associatedKeys.includes(key.addr)),
    [keystoreState.keys, account?.associatedKeys]
  )

  const internalKey = selectedAccountKeyStoreKeys.find((k) => k.type === 'internal')

  const handleAccept = useCallback(() => {
    if (!userRequest) return

    // TODO: Toast instead!
    if (!internalKey) return

    dispatch({
      type: 'MAIN_CONTROLLER_HANDLE_GET_ENCRYPTION_PUBLIC_KEY',
      params: {
        requestId: userRequest.id,
        keyAddr: internalKey.addr,
        keyType: internalKey.type
      }
    })
  }, [userRequest, dispatch, internalKey])

  const handleDeny = useCallback(() => {
    if (!userRequest) return

    dispatch({
      type: 'REQUESTS_CONTROLLER_REJECT_USER_REQUEST',
      params: { err: t('User rejected the request.'), id: userRequest.id }
    })
  }, [userRequest, t, dispatch])

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

  return (
    <>
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
              onResolve={handleAccept}
              resolveButtonText={t('Provide')}
              resolveDisabled={isViewOnly || isSmartAccount}
              resolveButtonTestID="button-provide"
              resolveNode={actionFooterResolveNode}
            />
          }
          backgroundColor={theme.quinaryBackground}
        >
          <TabLayoutWrapperMainContent>
            <RequestingDappInfo
              name={name}
              icon={icon}
              intentText={t('wants to get your public encryption key')}
            />

            <View style={[spacings.mtLg, flexbox.flex1, flexbox.justifySpaceBetween]}>
              <Alert
                title={t(
                  'By providing, this app will be able to compose encrypted messages to you.'
                )}
                type="info2"
              />

              {errorNode}
            </View>
          </TabLayoutWrapperMainContent>
        </TabLayoutContainer>
      </SmallNotificationWindowWrapper>
    </>
  )
}

export default React.memo(GetEncryptionPublicKeyRequestScreen)

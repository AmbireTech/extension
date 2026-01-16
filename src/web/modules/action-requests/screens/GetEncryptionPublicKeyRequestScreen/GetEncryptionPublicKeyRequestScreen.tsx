import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { getIsViewOnly } from '@ambire-common/utils/accounts'
import Alert from '@common/components/Alert'
import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
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

  // TODO: Display not supported for 1) smart accounts and 2) accounts with only hw wallet keys.
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
              resolveDisabled={isViewOnly}
              resolveButtonTestID="button-provide"
              {...(isViewOnly
                ? {
                    resolveNode: (
                      <View style={[{ flex: 3 }, flexbox.directionRow, flexbox.justifyEnd]}>
                        <NoKeysToSignAlert type="short" isTransaction={false} />
                      </View>
                    )
                  }
                : {})}
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

            <View style={spacings.mvLg}>
              <Alert
                title={t(
                  'By providing, this app will be able to compose encrypted messages to you.'
                )}
                type="info2"
              />
            </View>
          </TabLayoutWrapperMainContent>
        </TabLayoutContainer>
      </SmallNotificationWindowWrapper>
    </>
  )
}

export default React.memo(GetEncryptionPublicKeyRequestScreen)

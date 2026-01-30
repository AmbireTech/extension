import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import Alert from '@common/components/Alert'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import RequestingDappInfo from '@web/components/RequestingDappInfo'
import SmallNotificationWindowWrapper from '@web/components/SmallNotificationWindowWrapper'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useDappInfo from '@web/hooks/useDappInfo'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import ActionFooter from '@web/modules/action-requests/components/ActionFooter'
import { useEncryptionCapability } from '@web/modules/action-requests/hooks'

const GetEncryptionPublicKeyRequestScreen = () => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { currentUserRequest } = useRequestsControllerState()
  const { theme, themeType } = useTheme()
  const { addToast } = useToast()
  const {
    internalKey,
    errorNode,
    actionFooterResolveNode,
    selectedAccountKeyStoreKeys,
    isDisabled
  } = useEncryptionCapability()

  const userRequest = useMemo(
    () =>
      currentUserRequest?.kind === 'ethGetEncryptionPublicKey' ? currentUserRequest : undefined,
    [currentUserRequest]
  )

  const { name, icon } = useDappInfo(userRequest)

  const handleAccept = useCallback(() => {
    if (!userRequest) {
      const message = t(
        'The app request is missing required details. Please try to trigger the request again from the app.'
      )
      addToast(message, { type: 'error' })
      return
    }

    // should never happen (because the UI blocks it), but just in case
    if (!internalKey) {
      const selectedAccountKeyTypes = selectedAccountKeyStoreKeys.map((k) => k.type).join(' and ')
      const keyWord = selectedAccountKeyTypes.length === 1 ? t('key') : t('keys')
      const message = t(
        'This account uses {{selectedAccountKeyTypes}} {{keyWord}} that does not support getting encryption public key.',
        { selectedAccountKeyTypes, keyWord }
      )
      addToast(message, { type: 'error' })
      return
    }

    const keyAddr = internalKey.addr
    const keyType = internalKey.type

    dispatch({
      type: 'REQUESTS_CONTROLLER_RESOLVE_USER_REQUEST',
      params: { data: { keyAddr, keyType }, id: userRequest.id }
    })
  }, [t, userRequest, dispatch, addToast, internalKey, selectedAccountKeyStoreKeys])

  const handleDeny = useCallback(() => {
    if (!userRequest) return

    dispatch({
      type: 'REQUESTS_CONTROLLER_REJECT_USER_REQUEST',
      params: { err: t('User rejected the request.'), id: userRequest.id }
    })
  }, [userRequest, t, dispatch])

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
            onResolve={handleAccept}
            resolveButtonText={t('Provide')}
            resolveDisabled={isDisabled}
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

          <View style={spacings.mtLg}>
            {errorNode || (
              <Alert
                title={t('This app will be able to compose encrypted messages to you.')}
                type="info2"
              />
            )}
          </View>
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    </SmallNotificationWindowWrapper>
  )
}

export default React.memo(GetEncryptionPublicKeyRequestScreen)

import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
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
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import ActionFooter from '@web/modules/action-requests/components/ActionFooter'
import { useEncryptionCapability } from '@web/modules/action-requests/hooks'

const DecryptRequestScreen = () => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { currentUserRequest } = useRequestsControllerState()
  const { theme, themeType } = useTheme()

  const {
    isViewOnly,
    isSmartAccount,
    internalKey,
    selectedAccountKeyStoreKeys,
    errorNode,
    actionFooterResolveNode
  } = useEncryptionCapability()

  const userRequest = useMemo(
    () => (currentUserRequest?.kind === 'ethDecrypt' ? currentUserRequest : undefined),
    [currentUserRequest]
  )
  const encryptedMessage = userRequest?.meta?.params[0]

  const { name, icon } = useDappInfo(userRequest)

  const handleDecryptForPreview = useCallback(() => {
    // TODO: Implement
  }, [dispatch, internalKey, userRequest])

  const handleDecrypt = useCallback(() => {
    if (!userRequest) return
    if (!selectedAccountKeyStoreKeys.length) return
    if (!internalKey) return

    dispatch({
      type: 'REQUESTS_CONTROLLER_RESOLVE_USER_REQUEST',
      params: {
        data: { encryptedMessage, keyAddr: internalKey.addr, keyType: internalKey.type },
        id: userRequest.id
      }
    })
  }, [userRequest, dispatch, selectedAccountKeyStoreKeys, internalKey, encryptedMessage])

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
            <View>
              <Text>Encrypted message: {encryptedMessage}</Text>
              <Button
                text={t('Preview decrypted message')}
                onPress={handleDecryptForPreview}
                type="outline"
                hasBottomSpacing={false}
                style={spacings.phXl}
                accentColor={theme.secondaryText}
                disabled={isViewOnly || isSmartAccount}
              />
            </View>

            {errorNode}
          </View>
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    </SmallNotificationWindowWrapper>
  )
}

export default React.memo(DecryptRequestScreen)

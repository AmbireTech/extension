import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import ExpandableCard from '@common/components/ExpandableCard'
import Text from '@common/components/Text'
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
import eventBus from '@web/extension-services/event/eventBus'
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
  const { addToast } = useToast()
  const [decryptedMessage, setDecryptedMessage] = useState<string>('')
  const userRequest = useMemo(
    () => (currentUserRequest?.kind === 'ethDecrypt' ? currentUserRequest : undefined),
    [currentUserRequest]
  )
  const { name, icon } = useDappInfo(userRequest)
  const encryptedMessage = userRequest?.meta?.params[0]
  const {
    internalKey,
    selectedAccountKeyStoreKeys,
    errorNode,
    actionFooterResolveNode,
    isDisabled
  } = useEncryptionCapability({ requestType: 'decrypt' })

  const handleDecryptForPreview = useCallback(() => {
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

    dispatch({
      type: 'KEYSTORE_CONTROLLER_SEND_DECRYPTED_MESSAGE_TO_UI',
      params: {
        encryptedMessage: userRequest?.meta?.params[0],
        keyAddr: internalKey.addr,
        keyType: internalKey.type
      }
    })
  }, [t, dispatch, internalKey, userRequest, addToast, selectedAccountKeyStoreKeys])

  useEffect(() => {
    const onReceiveOneTimeData = (data: any) => {
      if (!data.decryptedMessage) return
      setDecryptedMessage(data.decryptedMessage)
    }

    eventBus.addEventListener('receiveOneTimeData', onReceiveOneTimeData)
    return () => eventBus.removeEventListener('receiveOneTimeData', onReceiveOneTimeData)
  }, [])

  const handleDecrypt = useCallback(() => {
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

    dispatch({
      type: 'REQUESTS_CONTROLLER_RESOLVE_USER_REQUEST',
      params: {
        data: { encryptedMessage, keyAddr: internalKey.addr, keyType: internalKey.type },
        id: userRequest.id
      }
    })
  }, [
    t,
    userRequest,
    dispatch,
    selectedAccountKeyStoreKeys,
    internalKey,
    encryptedMessage,
    addToast
  ])

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
            resolveDisabled={isDisabled}
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

          <View style={spacings.mtLg}>
            {errorNode || (
              <ExpandableCard
                enableToggleExpand={false}
                isInitiallyExpanded={true}
                hasArrow={false}
                content={
                  <View style={flexbox.flex1}>
                    {decryptedMessage ? (
                      <>
                        <Text
                          weight="semiBold"
                          style={[{ lineHeight: 12 }, spacings.mtTy, spacings.mbLg]}
                        >
                          {t('Decrypted message')}
                        </Text>
                        <Text selectable>{decryptedMessage}</Text>
                      </>
                    ) : (
                      <>
                        <View
                          style={[
                            flexbox.directionRow,
                            flexbox.justifySpaceBetween,
                            flexbox.alignCenter,
                            spacings.mb
                          ]}
                        >
                          <Text weight="semiBold" appearance="info2Text" style={{ lineHeight: 12 }}>
                            {t('Encrypted message')}
                          </Text>
                          <Button
                            text={t('Preview decrypted message')}
                            onPress={handleDecryptForPreview}
                            type="outline"
                            hasBottomSpacing={false}
                            accentColor={theme.info3Button}
                            disabled={isDisabled}
                            size="small"
                          />
                        </View>

                        <Text appearance="info2Text" selectable>
                          {encryptedMessage}
                        </Text>
                      </>
                    )}
                  </View>
                }
                style={{
                  backgroundColor:
                    themeType === THEME_TYPES.DARK
                      ? theme.tertiaryBackground
                      : theme.primaryBackground
                }}
              />
            )}
          </View>
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    </SmallNotificationWindowWrapper>
  )
}

export default React.memo(DecryptRequestScreen)

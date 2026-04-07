import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import ExpandableCard from '@common/components/ExpandableCard'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import ActionHeader from '@common/modules/action-requests/components/ActionHeader'
import eventBus from '@common/services/event/eventBus'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import RequestingDappInfo from '@web/components/RequestingDappInfo'
import SmallNotificationWindowWrapper from '@web/components/SmallNotificationWindowWrapper'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import useDappInfo from '@web/hooks/useDappInfo'
import ActionFooter from '@web/modules/action-requests/components/ActionFooter'
import { useEncryptionCapability } from '@web/modules/action-requests/hooks'

const DecryptRequestScreen = () => {
  const { t } = useTranslation()
  const { dispatch: keystoreDispatch } = useController('KeystoreController')
  const {
    state: { currentUserRequest },
    dispatch: requestsDispatch
  } = useController('RequestsController')
  const { theme } = useTheme()
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

    keystoreDispatch({
      type: 'method',
      params: {
        method: 'sendDecryptedMessageToUi',
        args: [
          {
            encryptedMessage: userRequest?.meta?.params[0],
            keyAddr: internalKey.addr,
            keyType: internalKey.type
          }
        ]
      }
    })
  }, [t, keystoreDispatch, internalKey, userRequest, addToast, selectedAccountKeyStoreKeys])

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

    requestsDispatch({
      type: 'method',
      params: {
        method: 'resolveUserRequest',
        args: [
          { encryptedMessage, keyAddr: internalKey.addr, keyType: internalKey.type },
          userRequest.id
        ]
      }
    })
  }, [
    t,
    userRequest,
    requestsDispatch,
    selectedAccountKeyStoreKeys,
    internalKey,
    encryptedMessage,
    addToast
  ])

  const handleDeny = useCallback(() => {
    if (!userRequest) return

    requestsDispatch({
      type: 'method',
      params: {
        method: 'rejectUserRequests',
        args: [t('User rejected the request.'), [userRequest.id]]
      }
    })
  }, [userRequest, t, requestsDispatch])

  return (
    <SmallNotificationWindowWrapper>
      <TabLayoutContainer
        width="full"
        header={<ActionHeader />}
        renderDirectChildren={() => (
          <ActionFooter
            onReject={handleDeny}
            onResolve={handleDecrypt}
            resolveButtonText={t('Decrypt')}
            resolveDisabled={isDisabled}
            resolveButtonTestID="button-decrypt"
            resolveNode={actionFooterResolveNode}
          />
        )}
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
                          <Text weight="semiBold" appearance="infoText" style={{ lineHeight: 12 }}>
                            {t('Encrypted message')}
                          </Text>
                          <Button
                            text={t('Preview decrypted message')}
                            onPress={handleDecryptForPreview}
                            type="outline"
                            hasBottomSpacing={false}
                            accentColor={theme.infoDecorative}
                            disabled={isDisabled}
                            size="small"
                          />
                        </View>

                        <Text appearance="infoText" selectable>
                          {encryptedMessage}
                        </Text>
                      </>
                    )}
                  </View>
                }
                style={{
                  backgroundColor: theme.secondaryBackground
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

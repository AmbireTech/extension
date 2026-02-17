import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import Alert from '@common/components/Alert'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import RequestingDappInfo from '@web/components/RequestingDappInfo'
import SmallNotificationWindowWrapper from '@web/components/SmallNotificationWindowWrapper'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import useDappInfo from '@web/hooks/useDappInfo'
import ActionFooter from '@web/modules/action-requests/components/ActionFooter'
import ActionHeader from '@web/modules/action-requests/components/ActionHeader'
import { useEncryptionCapability } from '@web/modules/action-requests/hooks'

const GetEncryptionPublicKeyRequestScreen = () => {
  const { t } = useTranslation()
  const { dispatch } = useControllersMiddleware()
  const {
    state: { currentUserRequest },
    dispatch: requestsDispatch
  } = useController('RequestsController')
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

    requestsDispatch({
      type: 'method',
      params: {
        method: 'resolveUserRequest',
        args: [{ keyAddr, keyType }, userRequest.id]
      }
    })
  }, [t, userRequest, requestsDispatch, addToast, internalKey, selectedAccountKeyStoreKeys])

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
            onResolve={handleAccept}
            resolveButtonText={t('Provide')}
            resolveDisabled={isDisabled}
            resolveButtonTestID="button-provide"
            resolveNode={actionFooterResolveNode}
          />
        )}
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
                type="info"
              />
            )}
          </View>
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    </SmallNotificationWindowWrapper>
  )
}

export default React.memo(GetEncryptionPublicKeyRequestScreen)

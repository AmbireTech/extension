import { useCallback, useEffect, useMemo, useState } from 'react'

import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useDappInfo from '@common/hooks/useDappInfo'
import useToast from '@common/hooks/useToast'
import eventBus from '@common/services/event/eventBus'

import { useEncryptionCapability } from '../useEncryptionCapability'

const useDecryptRequest = () => {
  const { t } = useTranslation()
  const { dispatch: keystoreDispatch } = useController('KeystoreController')
  const {
    state: { currentUserRequest },
    dispatch: requestsDispatch
  } = useController('RequestsController')
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

  return {
    t,
    userRequest,
    name,
    icon,
    encryptedMessage,
    decryptedMessage,
    internalKey,
    selectedAccountKeyStoreKeys,
    errorNode,
    actionFooterResolveNode,
    isDisabled,
    handleDecryptForPreview,
    handleDecrypt,
    handleDeny
  }
}

export default useDecryptRequest

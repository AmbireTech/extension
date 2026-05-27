import { useCallback, useMemo } from 'react'

import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useDappInfo from '@common/hooks/useDappInfo'
import useToast from '@common/hooks/useToast'

import { useEncryptionCapability } from '../useEncryptionCapability'

const useGetEncryptionPublicKeyRequest = () => {
  const { t } = useTranslation()

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

  return {
    t,
    userRequest,
    name,
    icon,
    internalKey,
    errorNode,
    actionFooterResolveNode,
    selectedAccountKeyStoreKeys,
    isDisabled,
    handleAccept,
    handleDeny
  }
}

export default useGetEncryptionPublicKeyRequest

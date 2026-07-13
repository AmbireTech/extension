import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import useWindowSize from '@common/hooks/useWindowSize'

const useSwitchAccount = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const {
    state: { account }
  } = useController('SelectedAccountController')
  const { dispatch: mainDispatch } = useController('MainController')

  const {
    state: { currentUserRequest },
    dispatch: requestsDispatch
  } = useController('RequestsController')
  const { accounts } = useController('AccountsController').state
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const { minHeightSize } = useWindowSize()

  const userRequest = useMemo(() => {
    if (currentUserRequest?.kind !== 'switchAccount') return null

    return currentUserRequest
  }, [currentUserRequest])

  const nextAccount = userRequest?.meta.switchToAccountAddr
  const nextRequestType = userRequest?.meta.nextRequestKind
  const nextAccountData = useMemo(() => {
    if (!nextAccount) return null

    return accounts.find((acc) => acc.addr === nextAccount) || null
  }, [accounts, nextAccount])
  const nextRequestLabel = useMemo(() => {
    if (nextRequestType === 'calls') return 'transaction signature'
    if (nextRequestType === 'message') return 'message signature'

    return 'unknown request'
  }, [nextRequestType])

  const dAppData = useMemo(() => userRequest?.dappPromises[0]?.session, [userRequest])

  const handleDenyButtonPress = useCallback(() => {
    if (!userRequest) return

    requestsDispatch({
      type: 'method',
      params: {
        method: 'rejectUserRequests',
        args: [t('User rejected the request.'), [userRequest.id]]
      }
    })
  }, [userRequest, t, requestsDispatch])

  const handleAuthorizeButtonPress = useCallback(() => {
    if (!userRequest) return

    if (!nextAccount) {
      addToast(
        t(
          'We are unable to switch to that account. Please reinitate the app request or contact support if the issue persists.'
        ),
        {
          type: 'error'
        }
      )
      return
    }

    setIsAuthorizing(true)

    mainDispatch({
      type: 'method',
      params: { method: 'selectAccount', args: [nextAccount] }
    })
  }, [addToast, userRequest, mainDispatch, nextAccount, t])

  const responsiveSizeMultiplier = useMemo(() => {
    if (minHeightSize('s')) return 0.85
    if (minHeightSize('m')) return 0.95

    return 1
  }, [minHeightSize])

  // Resolve the request
  useEffect(() => {
    if (account?.addr !== nextAccount || !userRequest || !userRequest) return

    requestsDispatch({
      type: 'method',
      params: {
        method: 'resolveUserRequest',
        args: [null, userRequest.id]
      }
    })
  }, [account?.addr, userRequest, requestsDispatch, nextAccount])

  return {
    t,
    account,
    isAuthorizing,
    userRequest,
    nextAccount,
    nextRequestType,
    nextAccountData,
    nextRequestLabel,
    dAppData,
    handleDenyButtonPress,
    handleAuthorizeButtonPress,
    responsiveSizeMultiplier
  }
}

export default useSwitchAccount

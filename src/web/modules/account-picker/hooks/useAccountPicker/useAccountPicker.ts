import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import usePrevious from '@common/hooks/usePrevious'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'

const useAccountPicker = () => {
  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()
  const {
    state: {
      pageSize,
      subType,
      isInitialized,
      initParams,
      selectedAccountsFromCurrentSession,
      addAccountsStatus
    },
    dispatch: accountPickerDispatch
  } = useController('AccountPickerController')
  const prevIsInitialized = usePrevious(isInitialized)
  const shouldResetAccountsSelectionOnUnmount = useRef(true)
  const { dispatch } = useControllersMiddleware()
  const [isReady, setIsReady] = useState(false)
  const [onImportPressed, setOnImportPressed] = useState(false)

  const ACCOUNT_PICKER_PAGE_SIZE = useMemo(() => {
    return subType === 'private-key' ? 1 : 5
  }, [subType])

  const setPage = React.useCallback(
    (page = 1) => {
      accountPickerDispatch({
        type: 'method',
        params: {
          method: 'setPage',
          args: [
            {
              page,
              pageSize: ACCOUNT_PICKER_PAGE_SIZE,
              shouldSearchForLinkedAccounts: true,
              shouldGetAccountsUsedOnNetworks: true
            }
          ]
        }
      })
    },
    [accountPickerDispatch, ACCOUNT_PICKER_PAGE_SIZE]
  )

  useEffect(() => {
    if (!initParams) {
      goToPrevRoute()
    }
  }, [dispatch, initParams, goToPrevRoute])

  useEffect(() => {
    if (isInitialized) return
    accountPickerDispatch({
      type: 'method',
      params: {
        method: 'init',
        args: []
      }
    })
  }, [accountPickerDispatch, isInitialized])

  useEffect(() => {
    if (!prevIsInitialized && isInitialized) {
      setPage(1)
    }
  }, [prevIsInitialized, isInitialized, setPage])

  useEffect(() => {
    if (pageSize === ACCOUNT_PICKER_PAGE_SIZE && !isReady) {
      setIsReady(true)
    }
  }, [pageSize, isReady, ACCOUNT_PICKER_PAGE_SIZE])

  // it will enter here only if onImportReady is called with selectedAccountsFromCurrentSession.length = 0
  useEffect(() => {
    if (onImportPressed && addAccountsStatus === 'SUCCESS') {
      goToNextRoute(WEB_ROUTES.accountPersonalize)
    }
  }, [addAccountsStatus, goToNextRoute, onImportPressed])

  const onImportReady = useCallback(() => {
    shouldResetAccountsSelectionOnUnmount.current = false
    setOnImportPressed(true)
    accountPickerDispatch({
      type: 'method',
      params: {
        method: 'addAccounts',
        args: []
      }
    })
    if (selectedAccountsFromCurrentSession.length) {
      goToNextRoute(WEB_ROUTES.accountPersonalize)
    }
  }, [goToNextRoute, accountPickerDispatch, selectedAccountsFromCurrentSession])

  useEffect(() => {
    return () => {
      if (shouldResetAccountsSelectionOnUnmount.current) {
        accountPickerDispatch({
          type: 'method',
          params: {
            method: 'resetAccountsSelection',
            args: []
          }
        })
      }
    }
  }, [accountPickerDispatch])

  return { isReady, setPage, onImportReady }
}

export default useAccountPicker

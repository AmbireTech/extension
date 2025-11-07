import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import usePrevious from '@common/hooks/usePrevious'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import useAccountPickerControllerState from '@web/hooks/useAccountPickerControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'

const useAccountPicker = () => {
  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()
  const {
    pageSize,
    subType,
    isInitialized,
    initParams,
    selectedAccountsFromCurrentSession,
    addAccountsStatus
  } = useAccountPickerControllerState()
  const prevIsInitialized = usePrevious(isInitialized)
  const shouldResetAccountsSelectionOnUnmount = useRef(true)
  const { dispatch } = useBackgroundService()
  const [isReady, setIsReady] = useState(false)
  const [onImportPressed, setOnImportPressed] = useState(false)

  const ACCOUNT_PICKER_PAGE_SIZE = useMemo(() => {
    return subType === 'private-key' ? 1 : 5
  }, [subType])

  const setPage = React.useCallback(
    (page = 1) => {
      dispatch({
        type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_SET_PAGE',
        params: {
          page,
          pageSize: ACCOUNT_PICKER_PAGE_SIZE,
          shouldSearchForLinkedAccounts: true,
          shouldGetAccountsUsedOnNetworks: true
        }
      })
    },
    [dispatch, ACCOUNT_PICKER_PAGE_SIZE]
  )

  useEffect(() => {
    if (!initParams) {
      goToPrevRoute()
    }
  }, [dispatch, initParams, goToPrevRoute])

  useEffect(() => {
    if (isInitialized) return
    dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT' })
  }, [dispatch, isInitialized])

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
    dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_ADD_ACCOUNTS' })
    if (selectedAccountsFromCurrentSession.length) {
      goToNextRoute(WEB_ROUTES.accountPersonalize)
    }
  }, [goToNextRoute, dispatch, selectedAccountsFromCurrentSession])

  useEffect(() => {
    return () => {
      if (shouldResetAccountsSelectionOnUnmount.current) {
        dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_RESET_ACCOUNTS_SELECTION' })
      }
    }
  }, [dispatch])

  return { isReady, setPage, onImportReady }
}

export default useAccountPicker

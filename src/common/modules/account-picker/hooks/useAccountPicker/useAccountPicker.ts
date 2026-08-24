import { isWeakMap } from 'lodash'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { HARDWARE_WALLET_DEVICE_NAMES } from '@ambire-common/consts/hardwareWallets'
import AccountPickerController from '@ambire-common/controllers/accountPicker/accountPicker'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import usePrevious from '@common/hooks/usePrevious'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'

export interface Account {
  type: string
  address: string
  brandName: string
  alianName?: string
  displayBrandName?: string
  index?: number
  balance?: number
}

const useAccountPicker = () => {
  const { t } = useTranslation()

  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()
  const {
    state: {
      pageSize,
      subType,
      isInitialized,
      initParams,
      addAccountsStatus,
      accountsLoading,
      selectedAccounts,
      type
    },
    dispatch: accountPickerDispatch
  } = useController('AccountPickerController')
  const { state: accounts } = useController('AccountsController', 'accounts')

  const prevIsInitialized = usePrevious(isInitialized)
  const prevAddAccountsStatus = usePrevious(addAccountsStatus)
  const shouldResetAccountsSelectionOnUnmount = useRef(true)
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
  }, [initParams, goToPrevRoute])

  useEffect(() => {
    if (isInitialized) return
    // Don't dispatch init if params were cleared by a reset (e.g. tab reload).
    if (!initParams) return

    accountPickerDispatch({
      type: 'method',
      params: {
        method: 'init',
        args: []
      }
    })
    // initParams is a gate, not a trigger: the messaging layer hands over a new object
    // on every state update, so having it in the deps double-initializes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Controller actions are fire-and-forget, so the personalization screen waits for the
  // accounts to be added. Keyed on the import having *left* 'LOADING' rather than on
  // 'SUCCESS', which the controller resets a tick later: both updates can land in one
  // render batch (mobile batches them across the webview bridge), so 'SUCCESS' is not
  // reliably rendered, while leaving 'LOADING' is.
  useEffect(() => {
    if (!onImportPressed) return
    if (prevAddAccountsStatus !== 'LOADING' || addAccountsStatus === 'LOADING') return

    goToNextRoute(WEB_ROUTES.accountPersonalize)
  }, [addAccountsStatus, prevAddAccountsStatus, goToNextRoute, onImportPressed])

  const onImportReady = useCallback(() => {
    // The button disables only once the controller reports it is importing, so a second
    // press before that would import a selection the first one has already cleared.
    if (onImportPressed) return

    shouldResetAccountsSelectionOnUnmount.current = false
    setOnImportPressed(true)
    accountPickerDispatch({
      type: 'method',
      params: {
        method: 'addAccounts',
        args: []
      }
    })
  }, [accountPickerDispatch, onImportPressed])

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

  const isLoading = useMemo(
    () => addAccountsStatus !== 'INITIAL' || !isReady || (!isInitialized && !!initParams),
    [addAccountsStatus, isReady, initParams, isInitialized]
  )

  const isImportDisabled = useMemo(
    () => isLoading || accountsLoading || (!selectedAccounts.length && !accounts.length),
    [isLoading, accountsLoading, selectedAccounts.length, accounts]
  )

  const shouldDisplayChangeHdPath = useMemo(
    () => !!(subType === 'seed' || (type && ['ledger', 'lattice', 'trezor'].includes(type))),
    [type, subType]
  )

  const setTitle = useCallback(
    (keyType: AccountPickerController['type'], subType: AccountPickerController['subType']) => {
      if (!isWeb) return t('Import accounts')

      if (keyType && keyType !== 'internal') {
        return t('Import accounts from {{ hwDeviceName }}', {
          hwDeviceName: HARDWARE_WALLET_DEVICE_NAMES[keyType]
        })
      }

      if (subType === 'seed') {
        return t('Import accounts from recovery phrase')
      }

      if (subType === 'private-key') {
        return t('Select account(s) to import')
      }

      return t('Select accounts to import')
    },
    [t]
  )

  return {
    isReady,
    setPage,
    onImportReady,
    isLoading,
    isImportDisabled,
    shouldDisplayChangeHdPath,
    setTitle
  }
}

export default useAccountPicker

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
      selectedAccountsFromCurrentSession,
      addAccountsStatus,
      accountsLoading,
      selectedAccounts,
      type
    },
    dispatch: accountPickerDispatch
  } = useController('AccountPickerController')
  const { accounts } = useController('AccountsController').state

  const prevIsInitialized = usePrevious(isInitialized)
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

  const isLoading = useMemo(
    () => addAccountsStatus !== 'INITIAL' || !isReady || (!isInitialized && !!initParams),
    [addAccountsStatus, isReady, initParams, isInitialized]
  )

  const isImportDisabled = useMemo(
    () => isLoading || accountsLoading || (!selectedAccounts.length && !accounts.length),
    [isLoading, accountsLoading, selectedAccounts.length, accounts]
  )

  const shouldDisplayChangeHdPath = useMemo(
    () =>
      !!(
        subType === 'seed' ||
        // TODO: Disabled for Trezor, because the flow that retrieves accounts
        // from the device as of v4.32.0 throws "forbidden key path" when
        // accessing non-"BIP44 Standard" paths. Alternatively, this could be
        // enabled in Trezor Suit (settings - safety checks), but even if enabled,
        // 1) user must explicitly allow retrieving each address (that means 25
        // clicks to retrieve accounts of the first 5 pages, blah) and 2) The
        // Trezor device shows a scarry note: "Wrong address path for selected
        // coin. Continue at your own risk!", which is pretty bad UX.
        // @ts-ignore
        ['ledger' as 'ledger', 'lattice' as 'lattice'].includes(type)
      ),
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

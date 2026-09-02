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

// Creating the smart account identities on the Relayer and updating their state afterwards
// can take a while on a slow connection, so the import gets more room than the default.
const ADD_ACCOUNTS_TIMEOUT_MS = 60_000

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
    dispatch: accountPickerDispatch,
    dispatchAndWait: accountPickerDispatchAndWait
  } = useController('AccountPickerController')
  const { state: accounts } = useController('AccountsController', 'accounts')

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

  const onImportReady = useCallback(async () => {
    // The button disables on re-render, so a second press landing in the same frame would
    // import a selection the first one has already cleared.
    if (onImportPressed) return

    shouldResetAccountsSelectionOnUnmount.current = false
    setOnImportPressed(true)

    try {
      // Controller actions are fire-and-forget, so the import replies to this call once the
      // accounts are actually added, instead of the screen watching a transient status.
      await accountPickerDispatchAndWait(
        {
          type: 'method',
          params: {
            // `dispatchAndWait` appends the request id as the last argument, so the accounts
            // param before it has to be passed explicitly (the controller reads the selection).
            method: 'addAccounts',
            args: [undefined]
          }
        },
        ADD_ACCOUNTS_TIMEOUT_MS
      )

      goToNextRoute(WEB_ROUTES.accountPersonalize)
    } catch {
      // The error itself is reported by the controller, here the screen only becomes usable again
      shouldResetAccountsSelectionOnUnmount.current = true
      setOnImportPressed(false)
    }
  }, [accountPickerDispatchAndWait, goToNextRoute, onImportPressed])

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

  // `onImportPressed` is what keeps the screen in its importing state until it navigates away.
  // The controller resets `addAccountsStatus` to 'INITIAL' right after the import completes,
  // which would otherwise flash the screen back to its idle state for a frame.
  const isLoading = useMemo(
    () =>
      onImportPressed ||
      addAccountsStatus !== 'INITIAL' ||
      !isReady ||
      (!isInitialized && !!initParams),
    [onImportPressed, addAccountsStatus, isReady, initParams, isInitialized]
  )

  const isImportDisabled = useMemo(
    () => isLoading || accountsLoading || (!selectedAccounts.length && !accounts.length),
    [isLoading, accountsLoading, selectedAccounts.length, accounts]
  )

  const shouldDisplayChangeHdPath = useMemo(
    () =>
      !!(
        subType === 'seed' ||
        (type && ['ledger', 'lattice', 'trezor', 'qr', 'nfc'].includes(type))
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

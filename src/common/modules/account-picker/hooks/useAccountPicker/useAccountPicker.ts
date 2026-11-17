import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { HARDWARE_WALLET_DEVICE_NAMES } from '@ambire-common/consts/hardwareWallets'
import type AccountPickerController from '@ambire-common/controllers/accountPicker/accountPicker'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import usePrevious from '@common/hooks/usePrevious'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts

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
  const { state: accounts } = useController('AccountsController', selectAccounts)

  const prevIsInitialized = usePrevious(isInitialized)
  const shouldResetAccountsSelectionOnUnmount = useRef(true)
  const [isReady, setIsReady] = useState(false)
  const [onImportPressed, setOnImportPressed] = useState(false)

  const ACCOUNT_PICKER_PAGE_SIZE = subType === 'private-key' ? 1 : 5

  const setPage = useCallback(
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
    // prepare the selection twice.
    if (onImportPressed) return

    shouldResetAccountsSelectionOnUnmount.current = false
    setOnImportPressed(true)

    try {
      // Replies once the selection is prepared, rather than the screen watching a transient
      // status. Personalize adds the accounts once the user proceeds.
      await accountPickerDispatchAndWait({
        type: 'method',
        params: { method: 'prepareSelectedAccounts', args: [] }
      })

      goToNextRoute(WEB_ROUTES.accountPersonalize)
      // Going back from the personalize step adds nothing, so the picker is usable again
      setOnImportPressed(false)
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

  // `onImportPressed` keeps the screen in its importing state while the selection is prepared
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
        (type && ['ledger', 'lattice', 'trezor', 'onekey', 'qr', 'nfc'].includes(type))
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

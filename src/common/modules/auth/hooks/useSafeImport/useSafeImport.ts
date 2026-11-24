import { getAddress, isAddress } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { getDefaultAccountPreferences } from '@ambire-common/libs/account/account'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useSafeApiSetting from '@common/hooks/useSafeApiSetting'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'

// sometimes safe addresses come like eth:address
// so we split it, if it has a :, and then we validate
const getSplitAddress = (value: string) => {
  const addr = value.trim()
  if (addr.indexOf(':') !== -1) {
    return addr.split(':')[1]!
  }
  return addr
}

const useSafeImport = () => {
  const { dispatch: safeDispatch, state } = useController('SafeController')
  const { isSafeApiEnabled } = useSafeApiSetting()
  const { state: accountsState } = useController('AccountsController')
  const { dispatchAndWait: accountPickerDispatchAndWait } = useController('AccountPickerController')
  const { statuses, importError, safeInfo } = state
  const { accounts } = accountsState
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm({
    mode: 'all',
    defaultValues: { safeAddress: '' }
  })
  const [isLoading, setIsLoading] = useState(false)
  const { addToast } = useToast()
  const safeAddressValue = useWatch({
    control,
    name: 'safeAddress'
  })
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { t } = useTranslation()
  const [safe, setSafe] = useState<string | null>('')

  const submitSafe = useCallback(async () => {
    // Also submitted with Enter, which skips the disabled button
    if (!safe || !safeInfo || isLoading || !isSafeApiEnabled) return

    try {
      setIsLoading(true)
      // Prepared for the personalize step, which adds it once the user proceeds
      await accountPickerDispatchAndWait({
        type: 'method',
        params: {
          method: 'prepareAccounts',
          args: [
            {
              accounts: [
                {
                  addr: safe,
                  associatedKeys: safeInfo.owners,
                  initialPrivileges: safeInfo.owners.map((o) => [o, '0x01']),
                  creation: null,
                  safeCreation: {
                    factoryAddr: safeInfo.factoryAddr,
                    singleton: safeInfo.singleton,
                    setupData: safeInfo.setupData,
                    saltNonce: safeInfo.saltNonce
                  },
                  preferences: getDefaultAccountPreferences(safe, accounts)
                }
              ]
            }
          ]
        }
      })
      reset()
      goToNextRoute(WEB_ROUTES.accountPersonalize)
      // Going back from the personalize step adds nothing, so the form is usable again
      setIsLoading(false)
    } catch (e: any) {
      setIsLoading(false)
      addToast(
        t(
          `Import unsuccessful. We were unable to fetch the necessary data.${
            e?.message ? ` Error: ${e?.message}` : ''
          }`
        ),
        { type: 'error' }
      )

      throw e
    }
  }, [
    goToNextRoute,
    addToast,
    accountPickerDispatchAndWait,
    t,
    safe,
    safeInfo,
    reset,
    isLoading,
    accounts,
    isSafeApiEnabled
  ])

  const handleFormSubmit = useCallback(() => {
    void handleSubmit(submitSafe)()
  }, [handleSubmit, submitSafe])

  const handleValidation = useCallback(
    (value: string) => {
      const trimmedValue = getSplitAddress(value)

      if (!trimmedValue.length) return t('Field is required.')

      if (!isAddress(trimmedValue)) return t('Invalid address.')

      return undefined
    },
    [t]
  )

  useEffect(() => {
    const safeAddr = getSplitAddress(safeAddressValue)
    if (!safeAddr.length || !isAddress(safeAddr)) {
      setSafe('')
      return
    }
    // Searched once the user turns the Safe API back on
    if (!isSafeApiEnabled) return

    // checksum before both storing and searching so the controller's importError.address
    // matches `safe` - otherwise a lowercase input hides the error while disabling the button
    const checksummedSafeAddr = getAddress(safeAddr)
    if (checksummedSafeAddr === safe) return

    setSafe(checksummedSafeAddr)
    if (checksummedSafeAddr !== safeInfo?.address) {
      safeDispatch({ type: 'method', params: { method: 'findSafe', args: [checksummedSafeAddr] } })
    }
  }, [safeDispatch, safeAddressValue, safeInfo?.address, safe, isSafeApiEnabled])

  // run on unmount
  useEffect(() => {
    return () => {
      safeDispatch({ type: 'method', params: { method: 'resetFind', args: [] } })
    }
  }, [safeDispatch])

  const isSafeImported = useMemo(() => {
    return safe && safeInfo && accounts.find((a) => a.addr === safe && !!a.safeCreation)
  }, [safe, safeInfo, accounts])

  const btnText = isLoading ? 'Loading...' : 'Continue'

  return {
    control,
    errors,
    isValid,
    statuses,
    importError,
    safeInfo,
    safe,
    isSafeImported,
    btnText,
    isLoading,
    isSafeApiEnabled,
    handleValidation,
    handleFormSubmit,
    goToPrevRoute
  }
}

export default useSafeImport

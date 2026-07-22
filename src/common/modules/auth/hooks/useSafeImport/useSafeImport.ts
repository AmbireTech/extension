import { getAddress, isAddress } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'

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
  const { dispatch: accountsDispatch, state: accountsState } = useController('AccountsController')
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
    if (!safe || !safeInfo || isLoading) return

    try {
      setIsLoading(true)
      accountsDispatch({
        type: 'method',
        params: {
          method: 'addAccounts',
          args: [
            [
              {
                addr: safe,
                associatedKeys: safeInfo.owners,
                initialPrivileges: safeInfo.owners.map((o) => [o, '0x01']),
                creation: null,
                safeCreation: {
                  factoryAddr: safeInfo.factoryAddr,
                  singleton: safeInfo.singleton,
                  setupData: safeInfo.setupData,
                  saltNonce: safeInfo.saltNonce,
                  version: safeInfo.version
                },
                preferences: {
                  label: 'Safe',
                  pfp: safe
                }
              }
            ]
          ]
        }
      })
      reset()
      goToNextRoute()
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
  }, [goToNextRoute, addToast, accountsDispatch, t, safe, safeInfo, reset, isLoading])

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

    if (safeAddr !== safe) setSafe(getAddress(safeAddr))
    if (safeAddr !== safe && safeAddr !== safeInfo?.address) {
      safeDispatch({ type: 'method', params: { method: 'findSafe', args: [safeAddr] } })
    }
  }, [safeDispatch, safeAddressValue, safeInfo?.address, safe])

  // run on unmount
  useEffect(() => {
    return () => {
      safeDispatch({ type: 'method', params: { method: 'resetFind', args: [] } })
    }
  }, [safeDispatch])

  const isSafeImported = useMemo(() => {
    return safe && safeInfo && accounts.find((a) => a.addr === safe && !!a.safeCreation)
  }, [safe, safeInfo, accounts])

  const btnText = useMemo(() => {
    if (isSafeImported) {
      return isLoading ? 'Proceeding...' : 'Proceed'
    }
    return isLoading ? 'Importing...' : 'Import'
  }, [isSafeImported, isLoading])

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
    handleValidation,
    handleFormSubmit,
    goToPrevRoute
  }
}

export default useSafeImport

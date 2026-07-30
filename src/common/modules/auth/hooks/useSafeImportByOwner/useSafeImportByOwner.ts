import { getAddress, isAddress } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { SAFE_NETWORKS } from '@ambire-common/consts/safe'
import { Account } from '@ambire-common/interfaces/account'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'

const getOwnerAddress = (value: string) => {
  const trimmedValue = value.trim()
  const separatorIndex = trimmedValue.indexOf(':')
  return separatorIndex === -1 ? trimmedValue : trimmedValue.slice(separatorIndex + 1)
}

const useSafeImportByOwner = () => {
  const {
    dispatch: safeDispatch,
    state: { safeOwnerSearch, statuses }
  } = useController('SafeController')
  const { state: importedAccounts } = useController('AccountsController', (state) => state.accounts)
  const {
    dispatch: mainDispatch,
    state: { statuses: mainStatuses }
  } = useController('MainController')
  const { state: enabledNetworks } = useController('NetworksController', (state) => state.networks)
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { t } = useTranslation()
  const {
    control,
    formState: { errors, isValid }
  } = useForm({
    mode: 'all',
    defaultValues: { ownerAddress: '' }
  })
  const ownerAddressValue = useWatch({ control, name: 'ownerAddress' })
  const [selectionOverrides, setSelectionOverrides] = useState<{
    owner: string
    selectedAddresses: string[]
    deselectedAddresses: string[]
  }>({ owner: '', selectedAddresses: [], deselectedAddresses: [] })
  const [onImportPressed, setOnImportPressed] = useState(false)

  const handleValidation = useCallback(
    (value: string) => {
      const ownerAddress = getOwnerAddress(value)
      if (!ownerAddress.length) return t('Field is required.')
      if (!isAddress(ownerAddress)) return t('Invalid address.')
      return undefined
    },
    [t]
  )

  const owner = useMemo(() => {
    const ownerAddress = getOwnerAddress(ownerAddressValue)
    return isAddress(ownerAddress) ? getAddress(ownerAddress) : ''
  }, [ownerAddressValue])

  useEffect(() => {
    if (!owner || safeOwnerSearch?.owner === owner || statuses.findSafesByOwner === 'LOADING')
      return
    safeDispatch({ type: 'method', params: { method: 'findSafesByOwner', args: [owner] } })
  }, [owner, safeOwnerSearch?.owner, safeDispatch, statuses.findSafesByOwner])

  useEffect(() => {
    return () => {
      safeDispatch({ type: 'method', params: { method: 'resetFindSafesByOwner', args: [] } })
    }
  }, [safeDispatch])

  useEffect(() => {
    if (!onImportPressed) return
    if (mainStatuses.updateAccounts === 'SUCCESS') goToNextRoute()
    // The external controller result unlocks the button so the user can retry.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (mainStatuses.updateAccounts === 'ERROR') setOnImportPressed(false)
  }, [goToNextRoute, mainStatuses.updateAccounts, onImportPressed])

  const safeAccounts = useMemo(
    () => (safeOwnerSearch?.owner === owner ? safeOwnerSearch.accounts : []),
    [owner, safeOwnerSearch]
  )
  const importedAddresses = useMemo(
    () => importedAccounts.map((account) => account.addr),
    [importedAccounts]
  )
  const importedAddressSet = useMemo(
    () => new Set(importedAddresses.map((address) => address.toLowerCase())),
    [importedAddresses]
  )
  const selectedAddresses = useMemo(() => {
    const overridesForOwner =
      selectionOverrides.owner === owner
        ? selectionOverrides
        : { selectedAddresses: [], deselectedAddresses: [] }
    const selectedAddressSet = new Set(
      overridesForOwner.selectedAddresses.map((address) => address.toLowerCase())
    )
    const deselectedAddressSet = new Set(
      overridesForOwner.deselectedAddresses.map((address) => address.toLowerCase())
    )

    return safeAccounts
      .map((account) => account.addr)
      .filter((address) => {
        const normalizedAddress = address.toLowerCase()
        if (selectedAddressSet.has(normalizedAddress)) return true
        if (deselectedAddressSet.has(normalizedAddress)) return false
        return importedAddressSet.has(normalizedAddress)
      })
  }, [importedAddressSet, owner, safeAccounts, selectionOverrides])

  const isSearching = !!owner && statuses.findSafesByOwner === 'LOADING'
  const safeSupportedNetworkCount = useMemo(
    () =>
      enabledNetworks.filter((network) => SAFE_NETWORKS.includes(Number(network.chainId))).length,
    [enabledNetworks]
  )
  const hasSearchCompleted =
    !!owner &&
    safeOwnerSearch?.owner === owner &&
    safeOwnerSearch.searchedNetworks.length === safeSupportedNetworkCount &&
    !isSearching
  const failedNetworkNames = useMemo(() => {
    if (safeOwnerSearch?.owner !== owner) return []
    return safeOwnerSearch.failedNetworks.map(
      (chainId) =>
        enabledNetworks.find((network) => network.chainId === chainId)?.name || chainId.toString()
    )
  }, [enabledNetworks, owner, safeOwnerSearch])

  const setAccountSelected = useCallback(
    (address: string, shouldSelect: boolean) => {
      setSelectionOverrides((currentState) => {
        const currentSelection =
          currentState.owner === owner
            ? currentState
            : { selectedAddresses: [], deselectedAddresses: [] }
        const normalizedAddress = address.toLowerCase()
        const removeAddress = (addresses: string[]) =>
          addresses.filter((currentAddress) => currentAddress.toLowerCase() !== normalizedAddress)

        return {
          owner,
          selectedAddresses: shouldSelect
            ? [...removeAddress(currentSelection.selectedAddresses), address]
            : removeAddress(currentSelection.selectedAddresses),
          deselectedAddresses: shouldSelect
            ? removeAddress(currentSelection.deselectedAddresses)
            : [...removeAddress(currentSelection.deselectedAddresses), address]
        }
      })
    },
    [owner]
  )

  const handleImport = useCallback(() => {
    if (isSearching || onImportPressed) return

    const selectedAddressSet = new Set(selectedAddresses.map((address) => address.toLowerCase()))
    const importedAddressSet = new Set(
      importedAccounts.map((account) => account.addr.toLowerCase())
    )
    const accountsToImport: Account[] = safeAccounts
      .filter((account) => selectedAddressSet.has(account.addr.toLowerCase()))
      .map(({ addr, associatedKeys, initialPrivileges, creation, safeCreation, preferences }) => ({
        addr,
        associatedKeys,
        initialPrivileges,
        creation,
        safeCreation,
        preferences
      }))
    const accountAddressesToRemove = safeAccounts
      .filter((account) => {
        const normalizedAddress = account.addr.toLowerCase()
        return (
          importedAddressSet.has(normalizedAddress) && !selectedAddressSet.has(normalizedAddress)
        )
      })
      .map((account) => account.addr)

    mainDispatch({
      type: 'method',
      params: {
        method: 'updateAccounts',
        args: [{ accountsToAdd: accountsToImport, accountAddressesToRemove }]
      }
    })
    setOnImportPressed(true)
  }, [
    importedAccounts,
    isSearching,
    mainDispatch,
    onImportPressed,
    safeAccounts,
    selectedAddresses
  ])

  return {
    control,
    errors,
    failedNetworkNames,
    handleImport,
    handleValidation,
    hasSearchCompleted,
    isSearching,
    isValid,
    goToPrevRoute,
    importedAccounts,
    isImporting: onImportPressed,
    safeAccounts,
    selectedAddresses,
    setAccountSelected
  }
}

export default useSafeImportByOwner

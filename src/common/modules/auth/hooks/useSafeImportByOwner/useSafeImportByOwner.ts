import { getAddress, isAddress } from 'ethers'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { SAFE_NETWORKS } from '@ambire-common/consts/safe'
import { Account } from '@ambire-common/interfaces/account'
import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'
import { Hex } from '@ambire-common/interfaces/hex'
import useAddressInput from '@common/hooks/useAddressInput'
import useController from '@common/hooks/useController'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'

type FormValues = {
  ownerAddress: AddressState
}

const useSafeImportByOwner = () => {
  const {
    dispatch: safeDispatch,
    state: { safeOwnerSearches, ownerCurrentlyDisplayingFor }
  } = useController('SafeController')
  const { state: importedAccounts } = useController('AccountsController', (state) => state.accounts)
  const {
    dispatch: mainDispatch,
    state: { statuses: mainStatuses }
  } = useController('MainController')
  const { state: enabledNetworks } = useController('NetworksController', (state) => state.networks)
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const {
    control,
    setValue,
    trigger,
    formState: { isValid }
  } = useForm<FormValues>({
    mode: 'all',
    defaultValues: {
      ownerAddress: {
        fieldValue: '',
        resolvedAddress: '',
        resolvedAddressType: null,
        isDomainResolving: false
      }
    }
  })
  const ownerAddressState = useWatch({ control, name: 'ownerAddress' })
  const [selectionOverrides, setSelectionOverrides] = useState<{
    owner: string
    selectedAddresses: string[]
    deselectedAddresses: string[]
  }>({ owner: '', selectedAddresses: [], deselectedAddresses: [] })
  const isImportRequested = useRef(false)
  const hasSeenUpdateAccountsLoading = useRef(false)

  const setOwnerAddressState = useCallback(
    (newState: AddressStateOptional) => {
      const addressStateEntries = Object.entries(newState) as [
        keyof AddressState,
        AddressState[keyof AddressState]
      ][]

      addressStateEntries.forEach(([key, value]) => {
        setValue(`ownerAddress.${key}`, value, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true
        })
      })
    },
    [setValue]
  )
  const handleRevalidateOwnerAddress = useCallback(() => {
    void trigger('ownerAddress.fieldValue')
  }, [trigger])
  const {
    address: ownerAddress,
    validation: ownerAddressValidation,
    RHFValidate: validateOwnerAddress
  } = useAddressInput({
    addressState: ownerAddressState,
    setAddressState: setOwnerAddressState,
    handleRevalidate: handleRevalidateOwnerAddress
  })

  const owner = useMemo<Hex | ''>(
    () => (isAddress(ownerAddress) ? (getAddress(ownerAddress) as Hex) : ''),
    [ownerAddress]
  )

  const safeSupportedNetworkIds = useMemo(
    () =>
      enabledNetworks
        .filter((network) => SAFE_NETWORKS.includes(Number(network.chainId)))
        .map((network) => network.chainId),
    [enabledNetworks]
  )

  const cachedSafeOwnerSearch = owner ? safeOwnerSearches[owner] : undefined
  const hasSearchedAllSafeNetworks =
    !!cachedSafeOwnerSearch &&
    cachedSafeOwnerSearch.searchedNetworks.length === safeSupportedNetworkIds.length &&
    safeSupportedNetworkIds.every((chainId) =>
      cachedSafeOwnerSearch.searchedNetworks.includes(chainId)
    )

  useEffect(() => {
    if (!owner) safeDispatch({ type: 'method', params: { method: 'resetSearchByOwner', args: [] } })
    else safeDispatch({ type: 'method', params: { method: 'findSafesByOwner', args: [owner] } })
    return () =>
      safeDispatch({ type: 'method', params: { method: 'resetSearchByOwner', args: [] } })
  }, [owner, safeDispatch])

  useEffect(() => {
    if (!isImportRequested.current) return
    if (mainStatuses.updateAccounts === 'LOADING') {
      hasSeenUpdateAccountsLoading.current = true
      return
    }
    if (!hasSeenUpdateAccountsLoading.current) return
    if (mainStatuses.updateAccounts === 'SUCCESS') {
      isImportRequested.current = false
      hasSeenUpdateAccountsLoading.current = false
      goToNextRoute()
      return
    }
    if (mainStatuses.updateAccounts === 'ERROR') {
      isImportRequested.current = false
      hasSeenUpdateAccountsLoading.current = false
    }
  }, [goToNextRoute, mainStatuses.updateAccounts])

  const currentDisplayableData = useMemo(
    () =>
      owner && owner === ownerCurrentlyDisplayingFor ? safeOwnerSearches[owner] || null : null,
    [safeOwnerSearches, owner, ownerCurrentlyDisplayingFor]
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

    return (currentDisplayableData?.accounts || [])
      .map((account) => account.addr)
      .filter((address) => {
        const normalizedAddress = address.toLowerCase()
        if (selectedAddressSet.has(normalizedAddress)) return true
        if (deselectedAddressSet.has(normalizedAddress)) return false
        return importedAddressSet.has(normalizedAddress)
      })
  }, [importedAddressSet, owner, currentDisplayableData?.accounts, selectionOverrides])

  const isSearching =
    (ownerCurrentlyDisplayingFor &&
      safeOwnerSearches[ownerCurrentlyDisplayingFor]?.status === 'LOADING') ||
    (owner && owner !== ownerCurrentlyDisplayingFor)

  const isMainBusy = Object.values(mainStatuses).some((status) => status !== 'INITIAL')
  const hasSearchCompleted =
    !!owner && !!currentDisplayableData && hasSearchedAllSafeNetworks && !isSearching

  const failedNetworkNames = useMemo(() => {
    if (!currentDisplayableData) return []
    console.log(currentDisplayableData.failedNetworks)
    return currentDisplayableData.failedNetworks.map(
      (chainId) =>
        enabledNetworks.find((network) => network.chainId === chainId)?.name || chainId.toString()
    )
  }, [enabledNetworks, currentDisplayableData])

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
    if (isSearching || isMainBusy || !currentDisplayableData?.accounts) return

    const selectedAddressSet = new Set(selectedAddresses.map((address) => address.toLowerCase()))
    const importedAddressSet = new Set(
      importedAccounts.map((account) => account.addr.toLowerCase())
    )
    const accountsToImport: Account[] = currentDisplayableData.accounts
      .filter((account) => selectedAddressSet.has(account.addr.toLowerCase()))
      .map(({ addr, associatedKeys, initialPrivileges, creation, safeCreation, preferences }) => ({
        addr,
        associatedKeys,
        initialPrivileges,
        creation,
        safeCreation,
        preferences
      }))
    const accountAddressesToRemove = currentDisplayableData.accounts
      .filter((account) => {
        const normalizedAddress = account.addr.toLowerCase()
        return (
          importedAddressSet.has(normalizedAddress) && !selectedAddressSet.has(normalizedAddress)
        )
      })
      .map((account) => account.addr)

    hasSeenUpdateAccountsLoading.current = false
    isImportRequested.current = true
    mainDispatch({
      type: 'method',
      params: {
        method: 'updateAccounts',
        args: [{ accountsToAdd: accountsToImport, accountAddressesToRemove }]
      }
    })
  }, [
    importedAccounts,
    isMainBusy,
    isSearching,
    mainDispatch,
    currentDisplayableData,
    selectedAddresses
  ])

  const isImportButtonDisabled =
    !isValid ||
    isSearching ||
    isMainBusy ||
    (hasSearchCompleted && !currentDisplayableData.accounts?.length)

  return {
    isImportButtonDisabled,
    control,
    failedNetworkNames,
    handleImport,
    hasSearchCompleted,
    isSearching,
    goToPrevRoute,
    importedAccounts,
    owner,
    ownerAddressState,
    ownerAddressValidation,
    safeAccounts: currentDisplayableData?.accounts || [],
    selectedAddresses,
    setAccountSelected,
    validateOwnerAddress
  }
}

export default useSafeImportByOwner

import { getAddress, isAddress } from 'ethers'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { SAFE_NETWORKS } from '@ambire-common/consts/safe'
import { Account } from '@ambire-common/interfaces/account'
import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'
import useAddressInput from '@common/hooks/useAddressInput'
import useController from '@common/hooks/useController'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'

type FormValues = {
  ownerAddress: AddressState
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
  const requestedOwner = useRef('')

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

  const owner = useMemo(
    () => (isAddress(ownerAddress) ? getAddress(ownerAddress) : ''),
    [ownerAddress]
  )

  useEffect(() => {
    if (!owner || requestedOwner.current === owner) return

    const isSameOwnerSearchLoading =
      statuses.findSafesByOwner === 'LOADING' && safeOwnerSearch?.owner === owner
    if (isSameOwnerSearchLoading) {
      requestedOwner.current = owner
      return
    }
    if (statuses.findSafesByOwner === 'LOADING') return

    requestedOwner.current = owner
    safeDispatch({ type: 'method', params: { method: 'findSafesByOwner', args: [owner] } })
  }, [owner, safeOwnerSearch?.owner, safeDispatch, statuses.findSafesByOwner])

  /**
   * We need this to mitigate the flashing when reentering this screen.
   * This cleans up the controller state after the user finishes
   */
  useEffect(
    () => () => {
      safeDispatch({ type: 'method', params: { method: 'resetFindSafesByOwner', args: [] } })
    },
    [safeDispatch]
  )

  useLayoutEffect(() => {
    if (!isImportRequested.current) return
    if (mainStatuses.updateAccounts !== 'LOADING') return

    isImportRequested.current = false
    goToNextRoute(undefined, { waitForAccountUpdate: true })
  }, [goToNextRoute, mainStatuses.updateAccounts])

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
  const isMainBusy = Object.values(mainStatuses).some((status) => status !== 'INITIAL')
  const isImporting = mainStatuses.updateAccounts === 'LOADING'
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
    if (isSearching || isMainBusy) return

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

    isImportRequested.current = true
    mainDispatch({
      type: 'method',
      params: {
        method: 'updateAccounts',
        args: [{ accountsToAdd: accountsToImport, accountAddressesToRemove }]
      }
    })
  }, [importedAccounts, isMainBusy, isSearching, mainDispatch, safeAccounts, selectedAddresses])

  return {
    control,
    failedNetworkNames,
    handleImport,
    hasSearchCompleted,
    isSearching,
    isValid,
    goToPrevRoute,
    importedAccounts,
    isImporting,
    ownerAddressState,
    ownerAddressValidation,
    safeAccounts,
    selectedAddresses,
    setAccountSelected,
    validateOwnerAddress
  }
}

export default useSafeImportByOwner

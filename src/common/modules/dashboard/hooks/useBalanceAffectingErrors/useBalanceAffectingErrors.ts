import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import { SelectedAccountBalanceError } from '@ambire-common/libs/selectedAccount/errors'
import useController from '@common/hooks/useController'

const useBalanceAffectingErrors = () => {
  const { t } = useTranslation()
  const {
    state: { balanceAffectingErrors, portfolio }
  } = useController('SelectedAccountController')
  const { allNetworks, areNetworksFetchingFromRelayer } = useController('NetworksController').state
  // While the networks config is being refreshed from the relayer, the balance is
  // held in a loading (skeleton) state and any updated RPC will trigger a portfolio
  // reload. Suppress balance-affecting warnings during this window so the user
  // never sees errors from a old/stale RPC that is about to be replaced.
  const isLoadingTakingTooLong = areNetworksFetchingFromRelayer
    ? false
    : portfolio.shouldShowPartialResult
  const { isOffline } = useController('MainController').state
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  /** Because errors change frequently due to background updates we have to store a snapshot
   * of the errors when the user clicks on the warning icon to display the errors in the bottom sheet.
   * Otherwise the user may want to screenshot the errors and the errors may change.
   */
  const [balanceAffectingErrorsSnapshot, setBalanceAffectingErrorsSnapshot] = useState<
    SelectedAccountBalanceError[]
  >([])

  const colibriWarningNetworkNames = useMemo(() => {
    if (portfolio.verification?.provider !== 'colibri') return []
    if (portfolio.verification.status !== 'warning') return []

    return portfolio.verification.failedChains.map((chainId) => {
      const network = allNetworks.find((n) => n.chainId.toString() === chainId)

      return network?.name || chainId
    })
  }, [allNetworks, portfolio.verification])

  const networksWithErrors = useMemo(() => {
    if (areNetworksFetchingFromRelayer) return []

    const allNetworkNames = balanceAffectingErrors.flatMap((banner) => banner.networkNames)

    const uniqueNetworkNames = [...new Set([...allNetworkNames, ...colibriWarningNetworkNames])]

    return uniqueNetworkNames
  }, [areNetworksFetchingFromRelayer, balanceAffectingErrors, colibriWarningNetworkNames])

  const warningMessage = useMemo(() => {
    if (areNetworksFetchingFromRelayer) return undefined

    if (isLoadingTakingTooLong) {
      const allNetworkNames = balanceAffectingErrors.find(
        ({ id }) => id === 'loading-too-long'
      )?.networkNames

      if (!allNetworkNames) return t('Still loading balances — this may take a moment.')

      const uniqueNetworkNames = [...new Set(allNetworkNames)]

      return t('Still loading balances on {{networks}} — this may take a moment.', {
        networks: uniqueNetworkNames.join(', ')
      })
    }

    if (isOffline && portfolio.isAllReady) return t('Please check your internet connection.')

    if (balanceAffectingErrors.length) {
      if (balanceAffectingErrors.length === 1 && balanceAffectingErrors[0]) {
        return t(balanceAffectingErrors[0].title)
      }

      return t(
        'Total balance may be inaccurate due to issues on {{networks}}. Click for more info.',
        {
          networks: networksWithErrors.join(', ')
        }
      )
    }

    if (colibriWarningNetworkNames.length) {
      return t("Colibri couldn't verify the balances on {{chains}}", {
        chains: colibriWarningNetworkNames.join(', ')
      })
    }

    return undefined
  }, [
    areNetworksFetchingFromRelayer,
    balanceAffectingErrors,
    colibriWarningNetworkNames,
    isLoadingTakingTooLong,
    isOffline,
    networksWithErrors,
    portfolio.isAllReady,
    t
  ])

  const onIconPress = useCallback(() => {
    if (isLoadingTakingTooLong || isOffline || !balanceAffectingErrors.length) {
      return
    }

    setBalanceAffectingErrorsSnapshot(balanceAffectingErrors)
    openBottomSheet()
  }, [balanceAffectingErrors, isLoadingTakingTooLong, isOffline, openBottomSheet])

  const closeBottomSheetWrapped = useCallback(() => {
    setBalanceAffectingErrorsSnapshot([])
    closeBottomSheet()
  }, [closeBottomSheet])

  return {
    sheetRef,
    balanceAffectingErrorsSnapshot,
    warningMessage,
    onIconPress,
    closeBottomSheetWrapped,
    networksWithErrors,
    isLoadingTakingTooLong
  }
}

export default useBalanceAffectingErrors

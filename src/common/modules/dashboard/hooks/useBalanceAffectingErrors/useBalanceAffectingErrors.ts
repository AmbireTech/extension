import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import { SelectedAccountBalanceError } from '@ambire-common/libs/selectedAccount/errors'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

const useBalanceAffectingErrors = () => {
  const { t } = useTranslation()
  const { balanceAffectingErrors, portfolio } = useSelectedAccountControllerState()
  const isLoadingTakingTooLong = portfolio.shouldShowPartialResult
  const { isOffline } = useMainControllerState()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  /** Because errors change frequently due to background updates we have to store a snapshot
   * of the errors when the user clicks on the warning icon to display the errors in the bottom sheet.
   * Otherwise the user may want to screenshot the errors and the errors may change.
   */
  const [balanceAffectingErrorsSnapshot, setBalanceAffectingErrorsSnapshot] = useState<
    SelectedAccountBalanceError[]
  >([])

  const networksWithErrors = useMemo(() => {
    const allNetworkNames = balanceAffectingErrors.flatMap((banner) => banner.networkNames)

    const uniqueNetworkNames = [...new Set(allNetworkNames)]

    return uniqueNetworkNames
  }, [balanceAffectingErrors])

  const warningMessage = useMemo(() => {
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
      if (balanceAffectingErrors.length === 1) {
        return t(balanceAffectingErrors[0].title)
      }

      return t(
        'Total balance may be inaccurate due to issues on {{networks}}. Click for more info.',
        {
          networks: networksWithErrors.join(', ')
        }
      )
    }

    return undefined
  }, [
    balanceAffectingErrors,
    isLoadingTakingTooLong,
    isOffline,
    networksWithErrors,
    portfolio.isAllReady,
    t
  ])

  const onIconPress = useCallback(() => {
    if (isLoadingTakingTooLong || isOffline) {
      return
    }

    // Sort errors so that errors are shown before warnings
    const sorted = [...balanceAffectingErrors].sort((a, b) => {
      const order = { error: 0, warning: 1 } as const
      return order[a.type] - order[b.type]
    })

    setBalanceAffectingErrorsSnapshot(sorted)
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

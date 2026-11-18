import { useCallback, useRef } from 'react'

import useController from '@common/hooks/useController'
import useExtraEntropy from '@common/hooks/useExtraEntropy'
import type { EnteredSeedPassphrase } from '@common/modules/account-select/components/EnterSeedPassphraseBottomSheet'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'

/**
 * Sets a Privacy Pools account flow up, from a stored recovery phrase or a new one, and moves on
 * to the personalize step at once - it prepares the account behind its loading state, lets the
 * user name it, and adds it once the user proceeds. `onStart` runs as it moves on (e.g. closing
 * the sheets), and `handleSheetClosed` lets the sheet start a flow again once it has closed.
 */
const useAddPrivacyPoolsAccount = ({ onStart }: { onStart: () => void }) => {
  const { dispatch: accountPickerDispatch, dispatchAndWait: accountPickerDispatchAndWait } =
    useController('AccountPickerController')
  const { goToNextRoute } = useOnboardingNavigation()
  const { getExtraEntropy } = useExtraEntropy()
  // A second tap landing before the sheet closes would start the flow, and open personalize, twice
  const isStartingRef = useRef(false)

  const moveOn = useCallback(() => {
    onStart()
    goToNextRoute(WEB_ROUTES.accountPersonalize)
  }, [goToNextRoute, onStart])

  const startFlow = useCallback(
    (params: { seedId?: string; extraEntropy?: string }) => {
      if (isStartingRef.current) return
      isStartingRef.current = true

      accountPickerDispatch({
        type: 'method',
        params: { method: 'setPrivacyPoolsInitParams', args: [params] }
      })
      moveOn()
    },
    [accountPickerDispatch, moveOn]
  )

  const handleSheetClosed = useCallback(() => {
    isStartingRef.current = false
  }, [])

  /**
   * A phrase whose passphrase isn't saved needs it, entered by the user and checked before moving
   * on. Resolves with whether it was wrong, which the passphrase sheet shows.
   */
  const addFromStoredSeed = useCallback(
    async (seedId: string, passphrase?: EnteredSeedPassphrase) => {
      if (!passphrase) {
        startFlow({ seedId })
        return false
      }
      if (isStartingRef.current) return false
      isStartingRef.current = true

      try {
        const reply = await accountPickerDispatchAndWait<
          'setPrivacyPoolsInitParams',
          { isWrongPassphrase: boolean }
        >({
          type: 'method',
          params: { method: 'setPrivacyPoolsInitParams', args: [{ seedId, ...passphrase }] }
        })
        if (reply.isWrongPassphrase) {
          isStartingRef.current = false
          return true
        }

        moveOn()
      } catch (error) {
        // The controller reports its own failures, here the sheet only closes
        console.error('Failed to set up the Privacy Pools account', error)
        isStartingRef.current = false
      }
      return false
    },
    [accountPickerDispatchAndWait, moveOn, startFlow]
  )

  const addFromNewSeed = useCallback(
    () => startFlow({ extraEntropy: getExtraEntropy() }),
    [getExtraEntropy, startFlow]
  )

  return { addFromStoredSeed, addFromNewSeed, handleSheetClosed }
}

export default useAddPrivacyPoolsAccount

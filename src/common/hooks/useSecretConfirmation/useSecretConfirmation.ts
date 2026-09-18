import { useCallback, useEffect, useRef, useState } from 'react'

import { captureException } from '@common/config/analytics/CrashAnalytics'
import { isWeb } from '@common/config/env'
import useBiometrics from '@common/hooks/useBiometrics'
import useBiometricsAvailability from '@common/hooks/useBiometricsAvailability'
import useController from '@common/hooks/useController'
import useRoute from '@common/hooks/useRoute'
import { openInternalPageInTab } from '@common/utils/links'
import { getUiType } from '@common/utils/uiType'
import { IS_FIREFOX } from '@web/constants/common'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const { isPopup, isTab, isSidePanel } = getUiType()

/**
 * WebAuthn cannot prompt inside the Firefox popup: the browser's modal takes focus and the popup
 * closes with it. There the screen is reopened in a tab, the only context it survives in.
 */
export const SHOULD_USE_TAB_FOR_BIOMETRICS = IS_FIREFOX && isPopup

/**
 * How long a screen is left alone before the ceremony starts on its own, so the user can read
 * why they are asked and the keyboard can finish going down. A tap on the icon is not delayed.
 */
const AUTO_PROMPT_DELAY = 500

// One value each, read off the state rather than built, so the store's reconciled snapshots stay
// reference stable. A selector that allocates returns a new value on every read and never settles.
const selectSecretVerificationResult = (state: AllControllersMappingType['KeystoreController']) =>
  state.signingAuthResult
const selectIsVerifyingSecret = (state: AllControllersMappingType['KeystoreController']) =>
  state.statuses.verifySecret === 'LOADING'
const selectRequestWindow = (state: AllControllersMappingType['RequestsController']) =>
  state.requestWindow

type Props = {
  /** Runs once the user has proven who they are. */
  onConfirmed: () => void
  /**
   * What the operating system's own biometric prompt says, so it reads the same as the screen
   * behind it. Honoured on native - the browser writes that dialog itself.
   */
  promptMessage?: string
}

/**
 * Re-confirming who the user is on an already unlocked keystore: biometrics when set up, the
 * password always reachable, and the switch between the two in one place rather than per screen.
 */
const useSecretConfirmation = ({ onConfirmed, promptMessage }: Props) => {
  const { getBiometricsSecret } = useBiometrics()
  const { canUnlockWithBiometrics, BiometricsIcon } = useBiometricsAvailability()
  const { dispatch: keystoreDispatch } = useController('KeystoreController')
  const { state: result } = useController('KeystoreController', selectSecretVerificationResult)
  const { state: isVerifying } = useController('KeystoreController', selectIsVerifyingSecret)
  const { state: requestWindow } = useController('RequestsController', selectRequestWindow)
  const { path } = useRoute()

  // Where the ceremony has to run in a tab, the password is what the screen opens on, so
  // confirming does not throw the user into a tab they did not ask for.
  const [hasSwitchedToPassword, setHasSwitchedToPassword] = useState(SHOULD_USE_TAB_FOR_BIOMETRICS)
  /** Whether a biometric ceremony is already up, so a second is not started on top of it. */
  const isPromptPending = useRef(false)
  const autoPromptTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Results are read from a shared controller field, so only the screen that asked for one may
  // act on it - otherwise a leftover result would let the next one through untouched
  const isAwaitingResult = useRef(false)
  const onConfirmedRef = useRef(onConfirmed)

  useEffect(() => {
    onConfirmedRef.current = onConfirmed
  }, [onConfirmed])

  const isUsingBiometrics = canUnlockWithBiometrics && !hasSwitchedToPassword

  const reset = useCallback(() => {
    isAwaitingResult.current = false
    isPromptPending.current = false
    setHasSwitchedToPassword(SHOULD_USE_TAB_FOR_BIOMETRICS)
    keystoreDispatch({ type: 'method', params: { method: 'resetSigningAuthResult', args: [] } })
  }, [keystoreDispatch])

  const confirmWithPassword = useCallback(
    (password: string) => {
      isAwaitingResult.current = true
      keystoreDispatch({
        type: 'method',
        params: { method: 'verifySecret', args: ['password', password] }
      })
    },
    [keystoreDispatch]
  )

  const confirmWithBiometrics = useCallback(async () => {
    if (isPromptPending.current) return

    // Where the ceremony cannot run, the screen is reopened in a tab and carried on there
    if (SHOULD_USE_TAB_FOR_BIOMETRICS) {
      await openInternalPageInTab({
        route: path.startsWith('/') ? path.slice(1) : path,
        shouldCloseCurrentWindow: !isTab && !isSidePanel,
        windowId: requestWindow?.windowProps?.createdFromWindowId
      })
      return
    }

    isPromptPending.current = true

    try {
      // WebAuthn is started before any state update, so a tap's user gesture is preserved -
      // getBiometricsSecret only awaits storage when the credential cache is cold
      if (isWeb) window.focus()

      const biometricsSecretPromise = getBiometricsSecret(promptMessage)
      // Only once the ceremony is under way, so the tap's gesture is not spent on a re-render -
      // otherwise the screen is left on the password field the user started from, behind the prompt.
      setHasSwitchedToPassword(false)

      const biometricsSecret = await biometricsSecretPromise
      // A cancelled or failed prompt resolves to null, which the OS has already reported
      if (!biometricsSecret) return

      isAwaitingResult.current = true
      keystoreDispatch({
        type: 'method',
        params: { method: 'verifySecret', args: ['biometrics', biometricsSecret] }
      })
    } catch (error) {
      captureException(error)
      setHasSwitchedToPassword(true)
    } finally {
      isPromptPending.current = false
    }
  }, [
    getBiometricsSecret,
    keystoreDispatch,
    promptMessage,
    path,
    requestWindow?.windowProps?.createdFromWindowId
  ])

  const cancelAutoPrompt = useCallback(() => {
    if (!autoPromptTimeoutRef.current) return

    clearTimeout(autoPromptTimeoutRef.current)
    autoPromptTimeoutRef.current = null
  }, [])

  /** Starts the ceremony a moment after the screen it belongs to is up. */
  const autoPromptBiometrics = useCallback(() => {
    cancelAutoPrompt()

    autoPromptTimeoutRef.current = setTimeout(() => {
      autoPromptTimeoutRef.current = null
      confirmWithBiometrics().catch(() => {})
    }, AUTO_PROMPT_DELAY)
  }, [cancelAutoPrompt, confirmWithBiometrics])

  useEffect(() => cancelAutoPrompt, [cancelAutoPrompt])

  const switchToPassword = useCallback(() => setHasSwitchedToPassword(true), [])

  const resetError = useCallback(() => {
    if (!result) return

    keystoreDispatch({ type: 'method', params: { method: 'resetSigningAuthResult', args: [] } })
  }, [keystoreDispatch, result])

  useEffect(() => {
    if (!isAwaitingResult.current) return
    if (result?.status !== 'success') return

    isAwaitingResult.current = false
    onConfirmedRef.current()
  }, [result])

  return {
    isUsingBiometrics,
    canUseBiometrics: canUnlockWithBiometrics,
    BiometricsIcon,
    isVerifying,
    errorMessage: result?.status === 'failed' ? result.error || '' : '',
    confirmWithBiometrics,
    autoPromptBiometrics,
    cancelAutoPrompt,
    confirmWithPassword,
    switchToPassword,
    resetError,
    reset
  }
}

export default useSecretConfirmation

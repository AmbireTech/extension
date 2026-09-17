import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useModalize } from 'react-native-modalize'

import { SigningAuthRequirement } from '@ambire-common/interfaces/signingAuth'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useBiometrics from '@common/hooks/useBiometrics'
import useController from '@common/hooks/useController'
import useRoute from '@common/hooks/useRoute'
import { openInternalPageInTab } from '@common/utils/links'
import { getUiType } from '@common/utils/uiType'
import { IS_FIREFOX } from '@web/constants/common'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const { isPopup, isTab, isSidePanel } = getUiType()

/**
 * WebAuthn cannot prompt inside the Firefox popup: the browser shows a modal that takes focus,
 * and the popup closes with it, taking the ceremony down. There the request is reopened in a
 * tab, which is the only context it survives in - the same thing the unlock screen does.
 */
const SHOULD_USE_TAB_FOR_BIOMETRICS = IS_FIREFOX && isPopup

const selectHasBiometricsSecret = (state: AllControllersMappingType['KeystoreController']) =>
  state.hasBiometricsSecret
// Both read a value that lives on the state rather than building one, so the store's
// reconciled snapshots stay reference stable and the component only re-renders on a change
const selectSigningAuthResult = (state: AllControllersMappingType['KeystoreController']) =>
  state.signingAuthResult
const selectIsVerifyingSecret = (state: AllControllersMappingType['KeystoreController']) =>
  state.statuses.verifySecret === 'LOADING'
const selectRequestWindow = (state: AllControllersMappingType['RequestsController']) =>
  state.requestWindow

type Props = {
  /** Why the request has to be confirmed, or `null`/`undefined` when it does not. */
  requirement: SigningAuthRequirement | null | undefined
  /**
   * The request the confirmation belongs to. A confirmation is remembered for this id only, so
   * changing the calls of a batch (or moving to another request) asks for it again.
   */
  requestId: string | number | null | undefined
}

/**
 * Asks the user to confirm their password or biometrics before a first time signing request goes
 * through, and remembers the dapps they confirmed for.
 */
const useSigningAuth = ({ requirement, requestId }: Props) => {
  const { t } = useTranslation()
  const { dispatch: keystoreDispatch } = useController('KeystoreController')
  const { dispatch: dappsDispatch } = useController('DappsController')
  const { state: hasBiometricsSecret } = useController(
    'KeystoreController',
    selectHasBiometricsSecret
  )
  const { state: signingAuthResult } = useController('KeystoreController', selectSigningAuthResult)
  const { state: isVerifying } = useController('KeystoreController', selectIsVerifyingSecret)
  const { state: requestWindow } = useController('RequestsController', selectRequestWindow)
  const { hasBiometricsHardware, getBiometricsSecret } = useBiometrics()
  const { path } = useRoute()
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()

  // Where the ceremony has to run in a tab, the sheet opens on the password, so pressing Sign
  // does not throw the user into a tab they did not ask for. Biometrics stays one tap away.
  const [hasSwitchedToPassword, setHasSwitchedToPassword] = useState(SHOULD_USE_TAB_FOR_BIOMETRICS)
  // Nothing renders differently once a request has been confirmed - the confirmation only has to
  // be readable by the next attempt to sign - so it is a ref rather than state. It is wrapped in
  // an object so a request with no id of its own still gets a latch, instead of matching the
  // "nothing confirmed yet" value and re-opening the prompt forever.
  const authenticatedFor = useRef<{ requestId: Props['requestId'] } | null>(null)
  // Results are read from a shared controller field, so only the prompt that asked for one may
  // act on it - otherwise a leftover result would let the next request through untouched
  const isAwaitingResult = useRef(false)
  /** Whether a biometric ceremony is already up, so a second one is not started on top of it. */
  const isPromptPending = useRef(false)
  const onAuthenticated = useRef<(() => void) | null>(null)

  const canUseBiometrics = !!hasBiometricsSecret && !!hasBiometricsHardware
  const isUsingBiometrics = canUseBiometrics && !hasSwitchedToPassword

  const title = t('Signing authentication')

  const reason = useMemo(() => {
    if (!requirement) return ''

    const { firstTimeRecipients, unauthenticatedDapps } = requirement
    const sentences: string[] = []

    if (firstTimeRecipients.length === 1) {
      sentences.push(t('You are sending to this address for the first time.'))
    } else if (firstTimeRecipients.length > 1) {
      sentences.push(
        t('You are sending to {{count}} addresses for the first time.', {
          count: firstTimeRecipients.length
        })
      )
    }

    if (unauthenticatedDapps.length) {
      sentences.push(
        t('This is your first time signing for {{dappNames}}.', {
          dappNames: unauthenticatedDapps.map(({ name }) => name).join(', ')
        })
      )
    }

    sentences.push(t('Please confirm it is you.'))

    return sentences.join(' ')
  }, [requirement, t])

  /**
   * Opens the prompt and runs `onConfirmed` once the user has proven their identity. Returns
   * whether the prompt took over, so the caller can stop and wait for it. Callers are the ones
   * that know which key is about to sign, so they must not call this for an external signer -
   * the hardware device asks for the confirmation itself.
   */
  const requestSigningAuth = useCallback(
    (onConfirmed: () => void) => {
      if (!requirement || authenticatedFor.current?.requestId === requestId) return false

      onAuthenticated.current = onConfirmed
      isAwaitingResult.current = false
      isPromptPending.current = false
      setHasSwitchedToPassword(SHOULD_USE_TAB_FOR_BIOMETRICS)
      keystoreDispatch({ type: 'method', params: { method: 'resetSigningAuthResult', args: [] } })
      openSheet()

      return true
    },
    [requirement, requestId, keystoreDispatch, openSheet]
  )

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

  const cancelSigningAuth = useCallback(() => {
    onAuthenticated.current = null
    isAwaitingResult.current = false
    closeSheet()
  }, [closeSheet])

  const confirmWithBiometrics = useCallback(async () => {
    // The sheet opening and a tap on the icon can both ask for it, and a second ceremony
    // while one is already up is what makes the browser hang
    if (isPromptPending.current) return

    // The request is reopened at the route the user is on, and carried on from there. Its state
    // lives in the background, so the screen comes back up as they left it.
    if (SHOULD_USE_TAB_FOR_BIOMETRICS) {
      cancelSigningAuth()
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

      // Native shows this on the operating system's own prompt, so it reads the same as the
      // sheet behind it. The browser writes its own dialog and ignores it.
      const biometricsSecretPromise = getBiometricsSecret(`${title}\n${reason}`)
      // Only once the ceremony is under way, so the tap's user gesture is not spent on a
      // re-render. Without it the sheet stays on the password it was started from, which is
      // what the user is left looking at behind the prompt.
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
    cancelSigningAuth,
    path,
    requestWindow?.windowProps?.createdFromWindowId,
    title,
    reason
  ])

  const switchToPassword = useCallback(() => setHasSwitchedToPassword(true), [])

  const resetError = useCallback(() => {
    if (!signingAuthResult) return

    keystoreDispatch({ type: 'method', params: { method: 'resetSigningAuthResult', args: [] } })
  }, [keystoreDispatch, signingAuthResult])

  useEffect(() => {
    if (!isAwaitingResult.current) return
    if (signingAuthResult?.status !== 'success') return

    isAwaitingResult.current = false

    // Remembered so the dapp is never asked about again, which is also what stops this prompt
    // from re-opening for the very same request
    requirement?.unauthenticatedDapps.forEach(({ id }) => {
      dappsDispatch({
        type: 'method',
        params: { method: 'updateDapp', args: [id, { signingAuthenticated: true }] }
      })
    })

    authenticatedFor.current = { requestId }
    closeSheet()

    const proceed = onAuthenticated.current
    onAuthenticated.current = null
    proceed?.()
  }, [closeSheet, dappsDispatch, requestId, requirement, signingAuthResult])

  const signingAuthProps = useMemo(
    () => ({
      title,
      reason,
      isUsingBiometrics,
      canUseBiometrics,
      isVerifying,
      errorMessage: signingAuthResult?.status === 'failed' ? signingAuthResult.error || '' : '',
      onConfirmWithPassword: confirmWithPassword,
      onConfirmWithBiometrics: confirmWithBiometrics,
      onSwitchToPassword: switchToPassword,
      onPasswordChange: resetError
    }),
    [
      title,
      reason,
      isUsingBiometrics,
      canUseBiometrics,
      isVerifying,
      signingAuthResult,
      confirmWithPassword,
      confirmWithBiometrics,
      switchToPassword,
      resetError
    ]
  )

  return {
    sheetRef,
    requestSigningAuth,
    cancelSigningAuth,
    signingAuthProps
  }
}

export default useSigningAuth

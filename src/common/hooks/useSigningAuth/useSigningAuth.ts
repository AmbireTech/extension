import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useModalize } from 'react-native-modalize'

import { SigningAuthRequirement } from '@ambire-common/interfaces/signingAuth'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useSecretConfirmation from '@common/hooks/useSecretConfirmation'

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
  const { dispatch: dappsDispatch } = useController('DappsController')
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()

  // Nothing renders differently once a request is confirmed, so it is a ref rather than state.
  // Wrapped in an object so a request with no id of its own still gets a latch.
  const authenticatedFor = useRef<{ requestId: Props['requestId'] } | null>(null)
  const onAuthenticated = useRef<(() => void) | null>(null)
  const requestIdRef = useRef(requestId)
  const unauthenticatedDappsRef = useRef(requirement?.unauthenticatedDapps)

  useEffect(() => {
    requestIdRef.current = requestId
    unauthenticatedDappsRef.current = requirement?.unauthenticatedDapps
  }, [requestId, requirement])

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

  const handleConfirmed = useCallback(() => {
    // Remembered so the dapp is never asked about again, which is also what stops this prompt
    // from re-opening for the very same request
    unauthenticatedDappsRef.current?.forEach(({ id }) => {
      dappsDispatch({
        type: 'method',
        params: { method: 'updateDapp', args: [id, { signingAuthenticated: true }] }
      })
    })

    authenticatedFor.current = { requestId: requestIdRef.current }
    closeSheet()

    const proceed = onAuthenticated.current
    onAuthenticated.current = null
    proceed?.()
  }, [closeSheet, dappsDispatch])

  const {
    isUsingBiometrics,
    canUseBiometrics,
    BiometricsIcon,
    isVerifying,
    errorMessage,
    confirmWithBiometrics,
    autoPromptBiometrics,
    cancelAutoPrompt,
    confirmWithPassword,
    switchToPassword,
    resetError,
    reset
  } = useSecretConfirmation({
    onConfirmed: handleConfirmed,
    // Native shows this on the operating system's own prompt, so it reads the same as the
    // sheet behind it. The browser writes its own dialog and ignores it.
    promptMessage: `${title}\n${reason}`
  })

  /**
   * Opens the prompt and runs `onConfirmed` once the user proved their identity; returns whether
   * it took over. Never call it for an external signer - the device asks for confirmation itself.
   */
  const requestSigningAuth = useCallback(
    (onConfirmed: () => void) => {
      if (!requirement || authenticatedFor.current?.requestId === requestId) return false

      onAuthenticated.current = onConfirmed
      reset()
      openSheet()

      return true
    },
    [requirement, requestId, reset, openSheet]
  )

  const cancelSigningAuth = useCallback(() => {
    onAuthenticated.current = null
    closeSheet()
  }, [closeSheet])

  const signingAuthProps = useMemo(
    () => ({
      title,
      reason,
      isUsingBiometrics,
      canUseBiometrics,
      BiometricsIcon,
      isVerifying,
      errorMessage,
      onConfirmWithPassword: confirmWithPassword,
      onConfirmWithBiometrics: confirmWithBiometrics,
      onAutoPromptBiometrics: autoPromptBiometrics,
      onCancelAutoPrompt: cancelAutoPrompt,
      onSwitchToPassword: switchToPassword,
      onPasswordChange: resetError
    }),
    [
      title,
      reason,
      isUsingBiometrics,
      canUseBiometrics,
      BiometricsIcon,
      isVerifying,
      errorMessage,
      confirmWithPassword,
      confirmWithBiometrics,
      autoPromptBiometrics,
      cancelAutoPrompt,
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

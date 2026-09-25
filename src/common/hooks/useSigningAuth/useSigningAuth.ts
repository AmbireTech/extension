import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  // What the sheet was opened for, so a confirmation applies to exactly what the user was shown
  const shownRequest = useRef<{
    requirement: SigningAuthRequirement
    requestId: Props['requestId']
  } | null>(null)
  const latestRequestId = useRef(requestId)

  useEffect(() => {
    latestRequestId.current = requestId
  }, [requestId])

  // Counts up per request, so the sheet opens only once the reset before it has rendered
  const [sheetOpenRequestId, setSheetOpenRequestId] = useState(0)

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
    const shown = shownRequest.current
    if (!shown) return
    shownRequest.current = null

    // Remembered so the dapp is never asked about again, which is also what stops this prompt
    // from re-opening for the very same request. Only the dapps the user was shown are marked.
    shown.requirement.unauthenticatedDapps.forEach(({ id }) => {
      dappsDispatch({
        type: 'method',
        params: { method: 'updateDapp', args: [id, { signingAuthenticated: true }] }
      })
    })

    authenticatedFor.current = { requestId: shown.requestId }
    closeSheet()

    const proceed = onAuthenticated.current
    onAuthenticated.current = null
    // The request changed while the prompt was up (e.g. a dapp updated the batch), so what gets
    // signed is not what was confirmed - the next sign attempt asks again for the new one
    if (shown.requestId !== latestRequestId.current) return

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
      // The latch has to be read off the object itself - optional chaining an empty one yields
      // `undefined`, which a request with no id of its own matches, skipping the prompt entirely
      const isAlreadyAuthenticated =
        !!authenticatedFor.current && authenticatedFor.current.requestId === requestId

      if (!requirement || isAlreadyAuthenticated) return false

      onAuthenticated.current = onConfirmed
      shownRequest.current = { requirement, requestId }
      reset()
      // Opened from an effect instead: the sheet's `onOpen` fires synchronously and would still
      // see the mode from before the reset, skipping the biometrics auto-prompt
      setSheetOpenRequestId((id) => id + 1)

      return true
    },
    [requirement, requestId, reset]
  )

  useEffect(() => {
    if (!sheetOpenRequestId) return

    openSheet()
  }, [sheetOpenRequestId, openSheet])

  const cancelSigningAuth = useCallback(() => {
    onAuthenticated.current = null
    shownRequest.current = null
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

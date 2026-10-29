import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { SafeDeploymentRequestError } from '@ambire-common/interfaces/safe'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'

/**
 * Whether the value is one of the error codes the RequestsController replies with when it
 * can't prepare the activation. They are already reported by the controller.
 */
export const isSafeDeploymentRequestError = (value: string): value is SafeDeploymentRequestError =>
  value === 'unavailable' || value === 'preparation-failed'

/**
 * Starts the activation (deployment) of a Safe account on a network by queueing its
 * deployment request, which the user then signs like any other transaction.
 * Preparation failures are shown to the user as an error toast.
 */
const useSafeActivation = (account: Account | null | undefined) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { dispatchAndWait: requestsDispatchAndWait } = useController('RequestsController')
  const activationsInProgressRef = useRef(new Set<string>())
  const isMountedRef = useRef(true)
  const [activatingChainIds, setActivatingChainIds] = useState<string[]>([])
  const activationErrorTexts: Record<SafeDeploymentRequestError, string> = useMemo(
    () => ({
      unavailable: t(
        "We can't activate this Safe account on this network. To use it here, activate it in the Safe app first."
      ),
      'preparation-failed': t(
        "We couldn't prepare the activation of your Safe account on this network. Please try again."
      )
    }),
    [t]
  )

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  const activateSafe = useCallback(
    async (chainId: bigint) => {
      if (!account?.safeCreation) return

      const chainIdKey = chainId.toString()
      const activationId = `${account.addr}-${chainIdKey}`
      if (activationsInProgressRef.current.has(activationId)) return

      activationsInProgressRef.current.add(activationId)
      setActivatingChainIds((current) => [...current, chainIdKey])

      try {
        await requestsDispatchAndWait(
          {
            type: 'method',
            params: {
              method: 'buildSafeDeploymentRequest',
              args: [account.addr, chainId]
            }
          },
          30_000
        )
      } catch (error) {
        const controllerError =
          error instanceof Error && isSafeDeploymentRequestError(error.message)
            ? error.message
            : null

        // Anything else (e.g. no reply in time) is unexpected and not reported yet
        if (!controllerError) {
          const activationError = new Error(
            `Failed to prepare Safe deployment for ${account.addr} on chain ${chainIdKey}.`,
            { cause: error }
          )
          console.error(activationError.message, error)
          captureException(activationError)
        }

        if (isMountedRef.current) {
          addToast(activationErrorTexts[controllerError ?? 'preparation-failed'], {
            type: 'error'
          })
        }
      } finally {
        activationsInProgressRef.current.delete(activationId)
        if (isMountedRef.current) {
          setActivatingChainIds((current) => current.filter((id) => id !== chainIdKey))
        }
      }
    },
    [account, requestsDispatchAndWait, addToast, activationErrorTexts]
  )

  return { activateSafe, activatingChainIds }
}

export default useSafeActivation

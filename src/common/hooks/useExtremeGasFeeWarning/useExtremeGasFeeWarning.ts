import { useEffect, useMemo, useState } from 'react'

import { EXTREME_GAS_FEE_PROCEED_DELAY_SECONDS } from '@ambire-common/consts/safeguards/extremeGasFee'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import { getExtremeGasFeeWarningState } from '@ambire-common/libs/safeguards/extremeGasFee'

const useExtremeGasFeeWarning = (
  signAccountOpState: ISignAccountOpController | null,
  networkChainId: bigint | undefined
) => {
  const warningState = useMemo(
    () => getExtremeGasFeeWarningState(signAccountOpState, networkChainId),
    [networkChainId, signAccountOpState]
  )

  const isWarningActive = !!warningState

  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [wasWarningActive, setWasWarningActive] = useState(false)

  // Reset the countdown when the warning toggles, during render (React's
  // recommended way to adjust state on a changing input) instead of in an
  // effect, which would call setState synchronously and cause cascading
  // renders. `warningState` is recomputed into a new object on every controller
  // update (every few seconds, and whenever the user changes the fee
  // speed/price), so keying on the boolean keeps the delay a one-off until the
  // warning clears and reappears.
  if (isWarningActive !== wasWarningActive) {
    setWasWarningActive(isWarningActive)
    setRemainingSeconds(isWarningActive ? EXTREME_GAS_FEE_PROCEED_DELAY_SECONDS : 0)
  }

  useEffect(() => {
    if (!isWarningActive) return

    const intervalId = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId)
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isWarningActive])

  const isProceedDelayed = isWarningActive && remainingSeconds > 0

  return {
    warningState,
    isActive: isWarningActive,
    isProceedDelayed,
    remainingSeconds,
    signButtonType: isWarningActive ? ('dangerFilled' as const) : ('primary' as const)
  }
}

export default useExtremeGasFeeWarning

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

  const [remainingSeconds, setRemainingSeconds] = useState(0)

  useEffect(() => {
    if (!warningState) {
      setRemainingSeconds(0)
      return
    }

    setRemainingSeconds(EXTREME_GAS_FEE_PROCEED_DELAY_SECONDS)

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
  }, [warningState])

  const isProceedDelayed = !!warningState && remainingSeconds > 0

  return {
    warningState,
    isActive: !!warningState,
    isProceedDelayed,
    remainingSeconds,
    signButtonType: warningState ? ('dangerFilled' as const) : ('primary' as const)
  }
}

export default useExtremeGasFeeWarning

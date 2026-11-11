import { useMemo } from 'react'

import useDecodedCallsByData from '@common/hooks/useDecodedCallsByData'

import type { IrCall } from '@ambire-common/libs/humanizer/interfaces'
/**
 * Returns the calls with their call data decoded from the function signatures the wallet has
 * saved. A call data is asked for once and its result is kept, so new calls with the same data
 * are decoded right away. A call data seen for the first time is returned as it is and decoded
 * one round trip later. Nothing is fetched, so a call with a signature the wallet has never seen
 * stays as it is.
 */
const useCallsWithDecodedData = (calls: IrCall[]): IrCall[] => {
  const callDatas = useMemo(() => calls.map(({ data }) => data), [calls])
  const decodedCallsByData = useDecodedCallsByData(callDatas)

  return useMemo(() => {
    let hasDecodedCall = false
    const callsWithDecodedData = calls.map((call) => {
      const decodedCall = decodedCallsByData.get(call.data)
      if (!decodedCall) return call

      hasDecodedCall = true

      return { ...call, decodedCall }
    })

    return hasDecodedCall ? callsWithDecodedData : calls
  }, [calls, decodedCallsByData])
}

export default useCallsWithDecodedData

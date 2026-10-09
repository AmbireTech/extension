import { useEffect, useMemo, useRef, useState } from 'react'

import type { DecodedCall } from '@ambire-common/interfaces/decodeCall'
import type { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import useController from '@common/hooks/useController'

/**
 * Returns the calls with their call data decoded from the function signatures the wallet has
 * saved. A call data is asked for once and its result is kept, so new calls with the same data
 * are decoded right away. A call data seen for the first time is returned as it is and decoded
 * one round trip later. Nothing is fetched, so a call with a signature the wallet has never seen
 * stays as it is.
 */
const useCallsWithDecodedData = (calls: IrCall[]): IrCall[] => {
  const { dispatchAndWait } = useController('ContractInfoController')
  const [decodedCallsByData, setDecodedCallsByData] = useState<Map<string, DecodedCall | null>>(
    () => new Map()
  )
  const requestedCallDatasRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const callDatas = [...new Set(calls.map(({ data }) => data))].filter(
      (data) => !requestedCallDatasRef.current.has(data)
    )
    if (!callDatas.length) return

    callDatas.forEach((data) => requestedCallDatasRef.current.add(data))

    dispatchAndWait<'decodeCallsForUi', (DecodedCall | null)[]>({
      type: 'method',
      params: { method: 'decodeCallsForUi', args: [callDatas] }
    })
      .then((decodedCalls) => {
        setDecodedCallsByData((prevDecodedCallsByData) => {
          const nextDecodedCallsByData = new Map(prevDecodedCallsByData)
          callDatas.forEach((data, index) => {
            nextDecodedCallsByData.set(data, decodedCalls[index] ?? null)
          })

          return nextDecodedCallsByData
        })
      })
      .catch((error) => {
        // Asked for again on the next change of the calls
        callDatas.forEach((data) => requestedCallDatasRef.current.delete(data))
        // The calls stay on screen without the parsed data, so this is not worth interrupting the user over
        captureException(error)
      })
  }, [calls, dispatchAndWait])

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

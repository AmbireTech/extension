import { useEffect, useRef, useState } from 'react'

import { captureException } from '@common/config/analytics/CrashAnalytics'
import useController from '@common/hooks/useController'

import type { DecodedCall } from '@ambire-common/interfaces/decodeCall'
/**
 * Decoded calls by their call data. A call data that is still being decoded
 * isn't in the map, and one with a signature the wallet has never seen is `null`
 */
export type DecodedCallsByData = Map<string, DecodedCall | null>

/**
 * Decodes call datas with the function signatures the wallet has saved. A call data is asked for
 * once and its result is kept, so new call datas that were seen before are decoded right away.
 * A call data seen for the first time is decoded one round trip later. Nothing is fetched, so a
 * call data with a signature the wallet has never seen is decoded to `null`.
 */
const useDecodedCallsByData = (callDatas: string[]): DecodedCallsByData => {
  const { dispatchAndWait } = useController('ContractInfoController')
  const [decodedCallsByData, setDecodedCallsByData] = useState<DecodedCallsByData>(() => new Map())
  const requestedCallDatasRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const callDatasToDecode = [...new Set(callDatas)].filter(
      (data) => !requestedCallDatasRef.current.has(data)
    )
    if (!callDatasToDecode.length) return

    callDatasToDecode.forEach((data) => requestedCallDatasRef.current.add(data))

    dispatchAndWait<'decodeCallsForUi', (DecodedCall | null)[]>({
      type: 'method',
      params: { method: 'decodeCallsForUi', args: [callDatasToDecode] }
    })
      .then((decodedCalls) => {
        setDecodedCallsByData((prevDecodedCallsByData) => {
          const nextDecodedCallsByData = new Map(prevDecodedCallsByData)
          callDatasToDecode.forEach((data, index) => {
            nextDecodedCallsByData.set(data, decodedCalls[index] ?? null)
          })

          return nextDecodedCallsByData
        })
      })
      .catch((error) => {
        // Asked for again on the next change of the call datas
        callDatasToDecode.forEach((data) => requestedCallDatasRef.current.delete(data))
        // The calls stay on screen without the parsed data, so this is not worth interrupting the user over
        captureException(error)
      })
  }, [callDatas, dispatchAndWait])

  return decodedCallsByData
}

export default useDecodedCallsByData

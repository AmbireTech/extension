import { useCallback, useMemo } from 'react'
import { isHex } from 'viem'

import { Selectors } from '@ambire-common/interfaces/contractInfo'
import { decodeCall, DecodedCall } from '@ambire-common/libs/decodeCall'
import useController from '@common/hooks/useController'

import type { IrCall } from '@ambire-common/libs/humanizer/interfaces'
interface UseDecodeTransactionDataReturn {
  decodedFunction: DecodedCall | null
}

const useDecodeTransactionData = (call: IrCall): UseDecodeTransactionDataReturn => {
  const {
    state: { selectors },
    dispatch
  } = useController('ContractInfoController')

  // TODO move
  function checkIfCanDecodeFurther(arg: DecodedCall['args'][number]): DecodedCall['args'][number] {
    if (typeof arg.val === 'string' && isHex(arg.val) && arg.val.length >= 10)
      return { key: arg.key, val: decodeFunction(arg.val) || arg.val }
    if (typeof arg.val === 'object' && Array.isArray(arg.val))
      return { key: arg.key, val: arg.val.map(checkIfCanDecodeFurther) }
    return arg
  }
  // TODO: add the hardcoded humanizer
  const decodeFunction = useCallback(
    (hex: string): DecodedCall | null => {
      if (!hex || hex.length < 10) return null
      const selector = hex.slice(0, 10)
      const foundSelectors: Selectors['string'] = selectors[selector]
      console.log(selectors)
      if (!foundSelectors) {
        dispatch({
          type: 'method',
          params: { method: 'getSelector', args: [selector] }
        })
        return null
      }
      if (foundSelectors?.status !== 'success' || !foundSelectors?.data?.length) return null

      const decoded = decodeCall(hex, foundSelectors.data)
      if (!decoded) return null
      // TODO go over each decoded large hex and check if it can be further decoded
      return {
        ...decoded,
        args: decoded.args.map(checkIfCanDecodeFurther)
      }
    },
    [dispatch, selectors]
  )
  const decodedFunction = useMemo(() => {
    if (!call.data || !isHex(call.data)) return null
    return decodeFunction(call.data)
  }, [call.data, decodeFunction])

  return {
    decodedFunction
  }
}

export default useDecodeTransactionData

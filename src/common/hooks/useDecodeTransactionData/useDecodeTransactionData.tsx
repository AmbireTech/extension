import { useMemo } from 'react'
import { isHex } from 'viem'

import { Selectors } from '@ambire-common/interfaces/contractInfo'
import { DecodedCall } from '@ambire-common/interfaces/decodeCall'
import { decodeCall } from '@ambire-common/libs/decodeCall'
import useController from '@common/hooks/useController'

import type { IrCall } from '@ambire-common/libs/humanizer/interfaces'
interface UseDecodeTransactionDataReturn {
  decodedFunction: DecodedCall | null
}

function checkIfCanDecodeFurther(
  arg: DecodedCall['args'][number],

  selectors: Selectors,
  fetchSelector: (selector: string) => void
): DecodedCall['args'][number] {
  if (typeof arg.val === 'string' && isHex(arg.val) && arg.val.length >= 10)
    return { key: arg.key, val: decodeFunction(arg.val, selectors, fetchSelector) || arg.val }
  if (typeof arg.val === 'object' && Array.isArray(arg.val))
    return {
      key: arg.key,
      val: arg.val.map((arg) => checkIfCanDecodeFurther(arg, selectors, fetchSelector))
    }
  return arg
}

// TODO: add the hardcoded humanizer
function decodeFunction(
  hex: string,
  selectors: Selectors,
  fetchSelector: (selector: string) => void
): DecodedCall | null {
  if (!hex || hex.length < 10) return null
  const selector = hex.slice(0, 10)
  const foundSelectors: Selectors[string] | undefined = selectors[selector]
  if (!foundSelectors) {
    fetchSelector(selector)
    return null
  }
  if (foundSelectors?.status !== 'success' || !foundSelectors?.data?.length) return null

  const decoded: DecodedCall | null = decodeCall(hex, foundSelectors.data)
  if (!decoded) return null
  return {
    ...decoded,
    args: decoded.args.map((arg) => checkIfCanDecodeFurther(arg, selectors, fetchSelector))
  }
}

const useDecodeTransactionData = (call: IrCall): UseDecodeTransactionDataReturn => {
  const {
    state: { selectors },
    dispatch
  } = useController('ContractInfoController')

  const decodedFunction = useMemo(() => {
    if (!call.data || !isHex(call.data)) return null
    return decodeFunction(call.data, selectors, (selector) => {
      dispatch({
        type: 'method',
        params: { method: 'getSelector', args: [selector] }
      })
    })
  }, [call.data, dispatch, selectors])

  return {
    decodedFunction
  }
}

export default useDecodeTransactionData

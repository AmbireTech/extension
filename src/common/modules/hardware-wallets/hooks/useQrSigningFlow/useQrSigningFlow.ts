import { Buffer } from 'buffer'
import { useCallback } from 'react'

import useController from '@common/hooks/useController'

const useQrSigningFlow = () => {
  const {
    state: { currentRequest, signingStep },
    dispatch: qrHardwareDispatch
  } = useController('QrHardwareController')

  const moveToResponseScan = useCallback(() => {
    qrHardwareDispatch({
      type: 'method',
      params: {
        method: 'moveToResponseScan',
        args: []
      }
    })
  }, [qrHardwareDispatch])

  const moveBack = useCallback(() => {
    qrHardwareDispatch({
      type: 'method',
      params: {
        method: 'moveBack',
        args: []
      }
    })
  }, [qrHardwareDispatch])

  const submitSignatureResponse = useCallback(
    (payload: string | Uint8Array) => {
      // On mobile the dispatch crosses the RN↔worker bridge, whose richJson codec
      // does NOT preserve Uint8Array. Send a hex string instead so the CBOR
      // survives; parseSignatureResponse accepts hex on both web and mobile.
      const serialized =
        typeof payload === 'string' ? payload : Buffer.from(payload).toString('hex')

      qrHardwareDispatch({
        type: 'method',
        params: {
          method: 'submitSignatureResponse',
          args: [serialized]
        }
      })
    },
    [qrHardwareDispatch]
  )

  const signingCleanup = useCallback(() => {
    qrHardwareDispatch({
      type: 'method',
      params: {
        method: 'signingCleanup',
        args: []
      }
    })
  }, [qrHardwareDispatch])

  return {
    currentRequest,
    signingStep,
    moveToResponseScan,
    moveBack,
    submitSignatureResponse,
    signingCleanup
  }
}

export default useQrSigningFlow

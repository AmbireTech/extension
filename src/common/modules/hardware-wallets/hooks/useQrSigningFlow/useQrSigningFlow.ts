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
      qrHardwareDispatch({
        type: 'method',
        params: {
          method: 'submitSignatureResponse',
          args: [payload]
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

import React from 'react'

import useController from '@common/hooks/useController'

import QrSignRequestScreen from '../QrSignRequestScreen/QrSignRequestScreen'
import QrSignResponseScanner from '../QrSignResponseScanner/QrSignResponseScanner'

const QrSigningFlowScreen = () => {
  const { currentRequest, signingStep, moveToResponseScan, submitSignatureResponse } =
    useController('QrHardwareController').state

  const request = currentRequest
  const step = signingStep

  if (!request) return null

  if (step === 'show-request') {
    return <QrSignRequestScreen frames={request.frames} onContinue={() => moveToResponseScan()} />
  }

  if (step === 'scan-response') {
    return (
      <QrSignResponseScanner onSignatureScanned={(payload) => submitSignatureResponse(payload)} />
    )
  }

  return null
}

export default React.memo(QrSigningFlowScreen)

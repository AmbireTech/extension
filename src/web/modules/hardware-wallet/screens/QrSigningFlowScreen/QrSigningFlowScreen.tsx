import React from 'react'

import { QrRequest, QrSigningStep } from '../../qr/types'
import QrSignRequestScreen from '../QrSignRequestScreen/QrSignRequestScreen'
import QrSignResponseScanner from '../QrSignResponseScanner/QrSignResponseScanner'

const QrSigningFlowScreen = ({
  currentRequest,
  signingStep,
  onContinue,
  submitSignatureResponse
}: {
  currentRequest: QrRequest | null
  signingStep: QrSigningStep
  onContinue: () => void
  submitSignatureResponse: (payload: string | Uint8Array) => void
}) => {
  const request = currentRequest
  const step = signingStep

  if (!request) return null

  if (step === 'show-request') {
    return <QrSignRequestScreen frames={request.frames} onContinue={onContinue} />
  }

  if (step === 'scan-response') {
    return (
      <QrSignResponseScanner onSignatureScanned={(payload) => submitSignatureResponse(payload)} />
    )
  }

  return null
}

export default React.memo(QrSigningFlowScreen)

import React from 'react'

import useController from '@common/hooks/useController'

import { QrRequest, QrSigningStep } from '../../qr/types'
import QrSignRequestScreen from '../QrSignRequestScreen/QrSignRequestScreen'
import QrSignResponseScanner from '../QrSignResponseScanner/QrSignResponseScanner'

const QrSigningFlowScreen = ({
  currentRequest,
  signingStep
}: {
  currentRequest: QrRequest | null
  signingStep: QrSigningStep
}) => {
  const request = currentRequest
  const step = signingStep

  if (!request) return null

  // dispatch MAIN_CONTROLLER_MOVE_TO_RESPONSE_SCAN_QR_WALLET

  if (step === 'show-request') {
    return <QrSignRequestScreen frames={request.frames} onContinue={() => console.log('moveto')} />
  }

  if (step === 'scan-response') {
    return (
      <QrSignResponseScanner
        onSignatureScanned={(payload) => console.log('submitQrSignatureResponse(payload)')}
      />
    )
  }

  return null
}

export default React.memo(QrSigningFlowScreen)

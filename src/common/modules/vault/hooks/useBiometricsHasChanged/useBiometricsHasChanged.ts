import { useEffect, useState } from 'react'
import { FieldError } from 'react-hook-form'

import { BIOMETRICS_CHANGED_ERR_MSG } from '../../contexts/vaultContext'
import { UseBiometricsHasChangedReturnType } from './types'

const useBiometricsHasChanged = (
  formPasswordErrMsg?: FieldError['message']
): UseBiometricsHasChangedReturnType => {
  const [biometricsHasChanged, setBiometricsHasChanged] = useState(false)

  useEffect(() => {
    // If we encounter this error, it signifies a permanent change in the
    // biometrics. Capture this event by setting a flag in the component state.
    // Why? Because unlike form errors, which reset with every change, this
    // flag should remain permanently flipped because it reflects the permanent
    // alteration in the biometrics.
    if (formPasswordErrMsg === BIOMETRICS_CHANGED_ERR_MSG) {
      setBiometricsHasChanged(true)
    }
  }, [formPasswordErrMsg])

  return { biometricsHasChanged }
}

export default useBiometricsHasChanged

import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

// One value each, read off the state rather than built, so the store's reconciled snapshots stay
// reference stable. A selector that allocates returns a new value on every read and never settles.
const selectHasBiometricsSecret = (state: AllControllersMappingType['KeystoreController']) =>
  state.hasBiometricsSecret
const selectIsPasswordUnlockRequired = (state: AllControllersMappingType['KeystoreController']) =>
  state.isPasswordUnlockRequired

/**
 * Whether the stored secret can be read back right now, which is the half of the answer that is
 * the same on every platform - each one decides on its own whether the device is capable at all.
 */
const useCanUnlockWithBiometrics = (isDeviceCapable: boolean) => {
  const { state: hasBiometricsSecret } = useController(
    'KeystoreController',
    selectHasBiometricsSecret
  )
  const { state: isPasswordUnlockRequired } = useController(
    'KeystoreController',
    selectIsPasswordUnlockRequired
  )

  // A secret left from before the user dropped their fingerprints cannot be read back, and the
  // password is the only way in while the keystore waits for the unlock that migrates it.
  return isDeviceCapable && !!hasBiometricsSecret && !isPasswordUnlockRequired
}

export default useCanUnlockWithBiometrics

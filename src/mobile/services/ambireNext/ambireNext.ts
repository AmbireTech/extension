import { NativeModules } from 'react-native'
import { sync } from 'react-native-stallion'

/*
 * Ambire Next is the  preview (early-access) release channel of the mobile app (the counterpart of the
 * Ambire Next extension). It is built on Stallion's beta testing: a release promoted with 0%
 * rollout reaches only the devices logged in with the project's SDK access PIN. Those releases
 * arrive through the regular production update check, so their signature is still verified.
 *
 * Stallion offers the PIN login only through its own testing modal. That modal also offers
 * Stallion's STAGE mode, which installs bundles WITHOUT verifying their signature, so the app
 * never shows it and calls the same native methods and endpoint here instead. They are not
 * part of the SDK's public API - re-check them when upgrading react-native-stallion.
 */

const STALLION_VERIFY_PIN_URL = 'https://api.stalliontech.io/api/v1/sdk/auth/verify-pin'

/** The length of the SDK access PIN set in the Stallion console. */
export const AMBIRE_NEXT_ACCESS_CODE_LENGTH = 6

type StallionConfig = {
  projectId: string
  appToken: string
  /** Set by the PIN login. Sent along every production update check, marking the device as internal. */
  sdkToken: string
}

const StallionNativeModule = NativeModules.Stallion

const getStallionConfig = async (): Promise<StallionConfig> =>
  JSON.parse(await StallionNativeModule.getStallionConfig())

export const getIsAmbireNextJoined = async () => {
  const { sdkToken } = await getStallionConfig()

  return !!sdkToken
}

/**
 * Logs the device into Stallion with the access code (the SDK access PIN).
 * Resolves to `false` when Stallion rejects the code, throws when Stallion itself fails.
 */
export const joinAmbireNext = async (accessCode: string) => {
  const { projectId, appToken } = await getStallionConfig()
  const response = await fetch(STALLION_VERIFY_PIN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-app-token': appToken
    },
    body: JSON.stringify({ pin: accessCode, projectId })
  })
  // Stallion rejects a request it can't verify with a client error (e.g. 400 for an
  // unknown project). A server error is Stallion failing, not a wrong code.
  if (response.status >= 500) {
    throw new Error(`Stallion PIN verification failed with status ${response.status}`)
  }

  const result = await response.json()
  // A token is trusted only from a successful response
  const sdkToken = response.ok ? result?.data?.token : undefined
  if (!sdkToken) return false

  await StallionNativeModule.updateSdkToken(sdkToken)
  // Otherwise a pending Ambire Next release would be picked up on the next app launch
  sync()

  return true
}

/**
 * Stops future Ambire Next releases. The one already installed stays until
 * a newer release reaches everyone (or a new store version is installed).
 */
export const leaveAmbireNext = async () => {
  await StallionNativeModule.updateSdkToken('')
}

import * as Application from 'expo-application'
import Constants from 'expo-constants'
import * as Updates from 'expo-updates'
import { Platform } from 'react-native'

import {
  APP_RELAYRLESS,
  CONSTANTS_ENDPOINT,
  EnvTypes,
  PAYTRIE_PARTNER_URL,
  RAMP_HOST_API_KEY,
  RELAYER_URL,
  SENTRY_DSN,
  SWAP_URL,
  TRANSAK_API_KEY_PROD,
  TRANSAK_API_KEY_STAGING,
  ZAPPER_API_ENDPOINT,
  ZAPPER_API_KEY
} from '@env'

import appJSON from '../../../../app.json'

export const isDev = process.env.APP_ENV === 'development'
export const isProd = process.env.APP_ENV === 'production'
export const isStaging = process.env.APP_ENV === 'staging'

/** On Android, this is the package name. On iOS, this is the bundle ID. */
export const APP_ID = Application.applicationId
/**
 * Internal app version, example: 1.0.0 (follows semantic versioning).
 * Fallback to the appJSON version, because in web mode Constants are missing.
 */
export const APP_VERSION = Constants?.expoConfig?.version || appJSON.expo.version
/**
 * The internal build version of the native build (binary).
 * This is the Info.plist value for `CFBundleVersion` on iOS and
 * the `versionCode` set by `build.gradle` on Android.
 */
export const BUILD_NUMBER = Application.nativeBuildVersion || 'N/A'

export const RELEASE_CHANNEL = Updates.channel || 'N/A'
export const RUNTIME_VERSION = Updates.runtimeVersion || 'N/A'
export const EXPO_SDK = Constants?.expoConfig?.sdkVersion || appJSON.expo.sdkVersion

export const isiOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'
export const isWeb = Platform.OS === 'web'

// eslint-disable-next-line @typescript-eslint/naming-convention
enum APP_ENV {
  PROD = 'production',
  STAGING = 'staging',
  DEV = 'development'
}

interface Config extends EnvTypes {
  APP_ENV: APP_ENV
  /**
   * Option to run the app without the Ambire Relayer. See `RELAYER_URL`
   * TODO: This is never tested, so it might not work!
   */
  APP_RELAYRLESS: boolean
  TRANSAK_ENV: 'STAGING' | 'PRODUCTION'
  COINGECKO_API_URL: string
}

const CONFIG: Config = {
  APP_ENV: APP_ENV.DEV,
  APP_RELAYRLESS: APP_RELAYRLESS === 'true',
  RELAYER_URL: 'https://relayer.ambire.com',
  ZAPPER_API_ENDPOINT,
  ZAPPER_API_KEY,
  VELCRO_API_ENDPOINT: 'https://velcro.ambire.com/v2',
  COINGECKO_API_URL: 'https://cena.ambire.com/api/v3',
  RAMP_HOST_API_KEY,
  PAYTRIE_PARTNER_URL,
  TRANSAK_API_KEY: TRANSAK_API_KEY_STAGING,
  TRANSAK_ENV: 'STAGING',
  SWAP_URL,
  SENTRY_DSN,
  CONSTANTS_ENDPOINT
}

if (isProd) {
  CONFIG.APP_ENV = APP_ENV.PROD
  CONFIG.TRANSAK_ENV = 'PRODUCTION'
  CONFIG.TRANSAK_API_KEY = TRANSAK_API_KEY_PROD
} else if (isStaging) {
  CONFIG.APP_ENV = APP_ENV.STAGING
}

/**
 * Option to run the app without the Ambire Relayer. See `RELAYER_URL`
 * That's special app mode, which is meant to be turned on only manually.
 * TODO: This is never tested, so it might not work!
 */
export const isRelayerless = CONFIG.APP_RELAYRLESS || !CONFIG.RELAYER_URL

export default CONFIG

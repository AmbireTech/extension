import * as Application from 'expo-application'
import Constants from 'expo-constants'
import * as Updates from 'expo-updates'
import { Platform } from 'react-native'

import { EnvTypes, NFT_CDN_URL, RELAYER_URL, SENTRY_DSN, VELCRO_URL } from '@env'

import appJSON from '../../../../app.json'

export const isTesting = process.env.IS_TESTING === 'true'
export const isDev = process.env.APP_ENV === 'development'
export const isProd = process.env.APP_ENV === 'production'
export const isStaging = process.env.APP_ENV === 'staging'
/**
 * Ambire Next is a separate production build variant used for beta testing and preview
 * before releasing features to the main production build. It allows us to have two
 * production webkit builds with different branding for testing purposes.
 */
export const isAmbireNext = process.env.AMBIRE_NEXT === 'true'

/** On Android, this is the package name. On iOS, this is the bundle ID. */
export const APP_ID = Application.applicationId
/**
 * Internal app version, example: 1.0.0 (follows semantic versioning).
 * Fallback to the appJSON version, because in web mode Constants are missing.
 */
export const APP_VERSION = Constants?.manifest?.version || appJSON.expo.version
/**
 * The internal build version of the native build (binary).
 * This is the Info.plist value for `CFBundleVersion` on iOS and
 * the `versionCode` set by `build.gradle` on Android.
 */
export const BUILD_NUMBER = Application.nativeBuildVersion || 'N/A'

export const RELEASE_CHANNEL = Updates.channel || 'N/A'
export const RUNTIME_VERSION = Updates.runtimeVersion || 'N/A'
export const EXPO_SDK = Constants?.manifest?.sdkVersion || 'N/A'

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
}

const CONFIG: Config = {
  APP_ENV: APP_ENV.DEV,
  RELAYER_URL,
  VELCRO_URL,
  SENTRY_DSN,
  NFT_CDN_URL: NFT_CDN_URL || 'https://nftcdn.ambire.com',
  ENVIRONMENT: process.env.ENVIRONMENT || 'development',
  DEFAULT_KEYSTORE_PASSWORD_DEV: process.env.DEFAULT_KEYSTORE_PASSWORD_DEV || '',
  LEGENDS_NFT_ADDRESS:
    process.env.LEGENDS_NFT_ADDRESS || '0xF51dF52d0a9BEeB7b6E4B6451e729108a115B863',
  SENTRY_DSN_LEGENDS: process.env.SENTRY_DSN_LEGENDS || '',
  SENTRY_DSN_BROWSER_EXTENSION: process.env.SENTRY_DSN_BROWSER_EXTENSION || ''
}

if (isProd) {
  CONFIG.APP_ENV = APP_ENV.PROD
} else if (isStaging) {
  CONFIG.APP_ENV = APP_ENV.STAGING
}

/**
 * Option to run the app without the Ambire Relayer. See `RELAYER_URL`
 * That's special app mode, which is meant to be turned on only manually.
 * TODO: This is never tested, so it might not work!
 */
export const isRelayerless = !CONFIG.RELAYER_URL

export default CONFIG

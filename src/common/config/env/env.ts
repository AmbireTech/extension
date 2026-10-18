import * as Application from 'expo-application'
import { Platform } from 'react-native'

import {
  BUNGEE_API_KEY,
  COWSWAP_API_KEY,
  DEFAULT_KEYSTORE_PASSWORD_DEV,
  EnvTypes,
  LI_FI_API_KEY,
  NFT_CDN_URL,
  RELAYER_URL,
  SENTRY_DSN_MOBILE,
  UNISWAP_API_KEY,
  VELCRO_URL,
  WALLETCONNECT_PROJECT_ID
} from '@env'

import appJSON from '../../../../app.json'

export const isTesting = process.env.IS_TESTING === 'true'
/**
 * Whether the JS runs as a debug build, whatever `APP_ENV` says. A dev-client session started with
 * `APP_ENV=production` is still a debug build. Always false where `__DEV__` doesn't exist, like
 * the extension and the websites.
 */
export const isDebugBuild = typeof __DEV__ !== 'undefined' && __DEV__
const runtimeAppEnv = process.env.APP_ENV || (isDebugBuild ? 'development' : 'production')
export const isDev = runtimeAppEnv === 'development'
export const isProd = runtimeAppEnv === 'production'
export const isStaging = runtimeAppEnv === 'staging'
export const isBenzin = process.env.BENZIN === 'true'
export const isLegends = process.env.LEGENDS === 'true'
export const isLedgerEmulator = process.env.IS_LEDGER_EMULATOR === 'true'
/**
 * Prefilled into the keystore password fields in dev, so they need not be typed every time.
 * Empty in every other build and in tests, which must start from an empty field.
 */
export const DEV_PREFILLED_PASSWORD =
  isDev && !isTesting ? (DEFAULT_KEYSTORE_PASSWORD_DEV ?? '') : ''
/**
 * Ambire Next is a separate production build variant used for beta testing and preview
 * before releasing features to the main production build. It allows us to have two
 * production webkit builds with different branding for testing purposes.
 */
export const isAmbireNext = process.env.AMBIRE_NEXT === 'true'
/** The Firefox build of the extension (popup, tab, request window or sidebar). False on mobile. */
export const isFirefoxBuild = process.env.WEB_ENGINE === 'gecko'

/** On Android, this is the package name. On iOS, this is the bundle ID. */
export const APP_ID = Application.applicationId
/**
 * Internal app version, example: 1.0.0 (follows semantic versioning).
 * Fallback to the appJSON version, because in web mode Constants are missing.
 */
export const APP_VERSION = appJSON.version
/**
 * The internal build version of the native build (binary).
 * This is the Info.plist value for `CFBundleVersion` on iOS and
 * the `versionCode` set by `build.gradle` on Android.
 */
export const BUILD_NUMBER = Application.nativeBuildVersion || 'N/A'

export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android'
export const isiOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'
export const isWeb = Platform.OS === 'web'

/**
 * Privacy Pools reach dev and Ambire Next builds first, for internal testing before production.
 * Extension only: mobile cannot prove (Hermes has no WebAssembly) and has no Privacy Pools screens.
 * Not on Firefox either, as it has no offscreen document and no proof finishes there.
 * Gates only the way into the feature (adding a Privacy Pools account); everything else shows up
 * only once such an account exists. Keep in sync with `isPrivacyPoolsBundled` in webpack/env.js.
 */
export const isPrivacyPoolsEnabled =
  isWeb && process.env.WEB_ENGINE !== 'gecko' && (isDev || isAmbireNext)

/**
 * Tornado Cash follows the Privacy Pools rollout and limits: its SDK runs in Web Workers, which
 * only the extension's offscreen document has (Chrome). Gates only the way into the feature.
 * Keep in sync with `isTornadoCashBundled` in webpack/env.js.
 */
export const isTornadoCashEnabled = isPrivacyPoolsEnabled

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
  SENTRY_DSN_MOBILE,
  NFT_CDN_URL: NFT_CDN_URL || 'https://nftcdn.ambire.com',
  ENVIRONMENT: process.env.ENVIRONMENT || 'development',
  DEFAULT_KEYSTORE_PASSWORD_DEV: process.env.DEFAULT_KEYSTORE_PASSWORD_DEV || '',
  DEFAULT_INVITE_CODE_DEV: process.env.DEFAULT_INVITE_CODE_DEV || '',
  LEGENDS_NFT_ADDRESS:
    process.env.LEGENDS_NFT_ADDRESS || '0xF51dF52d0a9BEeB7b6E4B6451e729108a115B863',
  SENTRY_DSN_LEGENDS: process.env.SENTRY_DSN_LEGENDS || '',
  SENTRY_DSN_BROWSER_EXTENSION: process.env.SENTRY_DSN_BROWSER_EXTENSION || '',
  BUNGEE_API_KEY,
  LI_FI_API_KEY,
  COWSWAP_API_KEY,
  UNISWAP_API_KEY: UNISWAP_API_KEY || '',
  WALLETCONNECT_PROJECT_ID
}

if (isProd) {
  CONFIG.APP_ENV = APP_ENV.PROD
} else if (isStaging) {
  CONFIG.APP_ENV = APP_ENV.STAGING
}

// This is only used for development builds, and it is not a secret, so it's fine to log it.
export const LEDGER_EMULATOR_HTTP_URL = process.env.LEDGER_EMULATOR_HTTP_URL

export default CONFIG

import { NETWORKS } from 'ambire-common/src/constants/networks'
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
  RPC_URL_ANDROMEDA,
  RPC_URL_ARBITRUM,
  RPC_URL_AURORA,
  RPC_URL_AVALANCHE,
  RPC_URL_BNB_CHAIN,
  RPC_URL_CRONOS,
  RPC_URL_ETHEREUM,
  RPC_URL_ETHEREUM_POW,
  RPC_URL_FANTOM,
  RPC_URL_GNOSIS,
  RPC_URL_KUCOIN,
  RPC_URL_MOONBEAM,
  RPC_URL_MOONRIVER,
  RPC_URL_OPTIMISM,
  RPC_URL_POLYGON,
  RPC_URL_RINKEBY,
  SENTRY_DSN,
  SWAP_URL,
  TRANSAK_API_KEY_PROD,
  TRANSAK_API_KEY_STAGING,
  VELCRO_API_ENDPOINT,
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
export const APP_VERSION = Constants?.manifest?.version || appJSON.expo.version
/**
 * The internal build version of the native build (binary).
 * This is the Info.plist value for `CFBundleVersion` on iOS and
 * the `versionCode` set by `build.gradle` on Android.
 */
export const BUILD_NUMBER = Application.nativeBuildVersion || 'N/A'

export const RELEASE_CHANNEL = Updates.releaseChannel || 'N/A'
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
  /**
   * Option to run the app without the Ambire Relayer. See `RELAYER_URL`
   * TODO: This is never tested, so it might not work!
   */
  APP_RELAYRLESS: boolean
  TRANSAK_ENV: 'STAGING' | 'PRODUCTION'
  /**
   * In blockchain terms, an RPC allows access to a server node on the specified
   * network and allows app to communicate and interact with that blockchain.
   */
  RPC_URLS: {
    [key in NETWORKS]: string
  }
}

const CONFIG: Config = {
  APP_ENV: APP_ENV.DEV,
  APP_RELAYRLESS: APP_RELAYRLESS === 'true',
  RELAYER_URL,
  ZAPPER_API_ENDPOINT,
  ZAPPER_API_KEY,
  VELCRO_API_ENDPOINT,
  RAMP_HOST_API_KEY,
  PAYTRIE_PARTNER_URL,
  TRANSAK_API_KEY: TRANSAK_API_KEY_STAGING,
  TRANSAK_ENV: 'STAGING',
  SWAP_URL,
  SENTRY_DSN,
  CONSTANTS_ENDPOINT,
  RPC_URLS: {
    [NETWORKS.ethereum]: RPC_URL_ETHEREUM,
    [NETWORKS.polygon]: RPC_URL_POLYGON,
    [NETWORKS.avalanche]: RPC_URL_AVALANCHE,
    [NETWORKS['binance-smart-chain']]: RPC_URL_BNB_CHAIN,
    [NETWORKS.fantom]: RPC_URL_FANTOM,
    [NETWORKS.moonbeam]: RPC_URL_MOONBEAM,
    [NETWORKS.moonriver]: RPC_URL_MOONRIVER,
    [NETWORKS.arbitrum]: RPC_URL_ARBITRUM,
    [NETWORKS.gnosis]: RPC_URL_GNOSIS,
    [NETWORKS.kucoin]: RPC_URL_KUCOIN,
    [NETWORKS.optimism]: RPC_URL_OPTIMISM,
    [NETWORKS.andromeda]: RPC_URL_ANDROMEDA,
    [NETWORKS.rinkeby]: RPC_URL_RINKEBY,
    [NETWORKS.cronos]: RPC_URL_CRONOS,
    [NETWORKS.aurora]: RPC_URL_AURORA,
    [NETWORKS['ethereum-pow']]: RPC_URL_ETHEREUM_POW
  }
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

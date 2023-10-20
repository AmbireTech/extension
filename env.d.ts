// Define the environment variables types here, so that the ts imports don't complain
// {@link https://github.com/goatandsheep/react-native-dotenv/issues/52#issuecomment-673218479|
declare module '@env' {
  // eslint-disable-next-line global-require
  const log = require('loglevel')

  export type EnvTypes = {
    /**
     * The Ambire relayer for all EVM chains. Responsible for managing on-chain
     * Identities (called "Ambire accounts") and relaying gasless transactions
     * to the Ethereum network. It is not intended to be blockchain-agnostic,
     * and it is Ethereum-specific.
     */
    RELAYER_URL: string

    /**
     * Ambire specific static constants, shared between all Ambire apps
     */
    CONSTANTS_ENDPOINT: string

    /**
     * Integrated decentralized exchange (DEX) in Ambire that allows users to
     * buy, sell and swap crypto assets.
     */
    SWAP_URL: string

    /**
     * The Zapper API provides DeFi related data, everything from liquidity
     * and prices on different AMMs to complex Defi protocol balances.
     */
    ZAPPER_API_ENDPOINT: string
    /**
     * See `ZAPPER_API_ENDPOINT`
     */
    ZAPPER_API_KEY: string

    /**
     * Alternative to Zapper, developed by Ambire. Serves the same purpose.
     */
    VELCRO_API_ENDPOINT: string

    /**
     * Used for updating the prices from Coingecko
     */
    // COINGECKO_API_URL: string

    /**
     * Ramp Network enables exchange of traditional currencies into cryptocurrencies
     */
    RAMP_HOST_API_KEY: string

    /**
     * Transak is a developer integration toolkit to let users buy / sell crypto
     */
    TRANSAK_API_KEY: string

    /**
     * Paytrie allows clients to exchange Canadian dollars (CAD) for stablecoins
     */
    PAYTRIE_PARTNER_URL: string

    /**
     * Sentry is application monitoring and error tracking app
     */
    SENTRY_DSN: string
  }

  export const RELAYER_URL: EnvTypes['RELAYER_URL']
  export const APP_RELAYRLESS: string
  export const CONSTANTS_ENDPOINT: EnvTypes['CONSTANTS_ENDPOINT']
  export const SWAP_URL: EnvTypes['SWAP_URL']

  export const ZAPPER_API_ENDPOINT: EnvTypes['ZAPPER_API_ENDPOINT']
  export const ZAPPER_API_KEY: EnvTypes['ZAPPER_API_KEY']
  export const VELCRO_API_ENDPOINT: EnvTypes['VELCRO_API_ENDPOINT']
  // export const COINGECKO_API_URL: EnvTypes['COINGECKO_API_URL']

  export const RAMP_HOST_API_KEY: EnvTypes['RAMP_HOST_API_KEY']
  export const TRANSAK_API_KEY_STAGING: EnvTypes['TRANSAK_API_KEY']
  export const TRANSAK_API_KEY_PROD: EnvTypes['TRANSAK_API_KEY']
  export const PAYTRIE_PARTNER_URL: EnvTypes['PAYTRIE_PARTNER_URL']

  export const SENTRY_DSN: EnvTypes['SENTRY_DSN']

  /**
   * Possible log level descriptors, may be string, lower or upper case, or number.
   * There are 6 levels: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'.
   * This disables all logging below the given level, so that after a
   * log.setLevel("warn") call log.warn("something") or log.error("something")
   * will output messages, but log.info("something") will not.
   */
  export const BROWSER_EXTENSION_DEFAULT_LOG_LEVEL_PROD: log.LogLevelDesc
  /** See `BROWSER_EXTENSION_DEFAULT_LOG_LEVEL_PROD` */
  export const BROWSER_EXTENSION_DEFAULT_LOG_LEVEL_DEV: log.LogLevelDesc

  /**
   * This value can be used to control the unique ID of an extension, when it is
   * loaded during development. In prod, the ID is generated in Chrome Web Store
   * and can't be changed (could be retrieved from Chrome Web Store).
   * In DEV, it is generated based on a key.pem using the following method:
   * {@link https://stackoverflow.com/a/46739698/1333836}
   */
  export const BROWSER_EXTENSION_PUBLIC_KEY: string

  /**
   * Deploy key for the private ambire-common repository
   */
  export const AMBIRE_COMMON_SSH_DEPLOY_KEY_BASE64: string
}

// Define the environment variables types here, so that the ts imports don't complain
// {@link https://github.com/goatandsheep/react-native-dotenv/issues/52#issuecomment-673218479|
declare module '@env' {
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

  export const RPC_URL_ETHEREUM: string
  export const RPC_URL_POLYGON: string
  export const RPC_URL_AVALANCHE: string
  export const RPC_URL_BNB_CHAIN: string
  export const RPC_URL_FANTOM: string
  export const RPC_URL_MOONBEAM: string
  export const RPC_URL_MOONRIVER: string
  export const RPC_URL_ARBITRUM: string
  export const RPC_URL_GNOSIS: string
  export const RPC_URL_KUCOIN: string
  export const RPC_URL_OPTIMISM: string
  export const RPC_URL_ANDROMEDA: string
  export const RPC_URL_RINKEBY: string
  export const RPC_URL_CRONOS: string
  export const RPC_URL_AURORA: string
  export const RPC_URL_ETHEREUM_POW: string

  export const ZAPPER_API_ENDPOINT: EnvTypes['ZAPPER_API_ENDPOINT']
  export const ZAPPER_API_KEY: EnvTypes['ZAPPER_API_KEY']
  export const VELCRO_API_ENDPOINT: EnvTypes['VELCRO_API_ENDPOINT']

  export const RAMP_HOST_API_KEY: EnvTypes['RAMP_HOST_API_KEY']
  export const TRANSAK_API_KEY_STAGING: EnvTypes['TRANSAK_API_KEY']
  export const TRANSAK_API_KEY_PROD: EnvTypes['TRANSAK_API_KEY']
  export const PAYTRIE_PARTNER_URL: EnvTypes['PAYTRIE_PARTNER_URL']

  export const SENTRY_DSN: EnvTypes['SENTRY_DSN']
}

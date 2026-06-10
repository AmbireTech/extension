declare module '@trezor/connect-webextension' {
  export * from '@trezor/connect-webextension/lib/index'
  import trezorConnect from '@trezor/connect-webextension/lib/index'

  import { TrezorConnect } from '@trezor/connect/lib/types/api/index'

  export { TrezorConnect }
  export default trezorConnect
}

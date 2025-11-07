// eslint-disable-next-line import/no-extraneous-dependencies
import TrezorConnect from '@trezor/connect'
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link/libDev/src/websocket-client.js'

const UI = {
  RECEIVE_PERMISSION: 'ui-receive_permission',
  RECEIVE_CONFIRMATION: 'ui-receive_confirmation',
  RECEIVE_PIN: 'ui-receive_pin',
  RECEIVE_PASSPHRASE: 'ui-receive_passphrase',
  RECEIVE_DEVICE: 'ui-receive_device',
  RECEIVE_ACCOUNT: 'ui-receive_account',
  RECEIVE_FEE: 'ui-receive_fee',
  RECEIVE_WORD: 'ui-receive_word',
  INVALID_PASSPHRASE_ACTION: 'ui-invalid_passphrase_action',
  CHANGE_SETTINGS: 'ui-change_settings',
  LOGIN_CHALLENGE_RESPONSE: 'ui-login_challenge_response',
  TRANSPORT: 'ui-no_transport',
  BOOTLOADER: 'ui-device_bootloader_mode',
  NOT_IN_BOOTLOADER: 'ui-device_not_in_bootloader_mode',
  REQUIRE_MODE: 'ui-device_require_mode',
  INITIALIZE: 'ui-device_not_initialized',
  SEEDLESS: 'ui-device_seedless',
  FIRMWARE_OLD: 'ui-device_firmware_old',
  FIRMWARE_OUTDATED: 'ui-device_firmware_outdated',
  FIRMWARE_NOT_SUPPORTED: 'ui-device_firmware_unsupported',
  FIRMWARE_NOT_COMPATIBLE: 'ui-device_firmware_not_compatible',
  FIRMWARE_NOT_INSTALLED: 'ui-device_firmware_not_installed',
  FIRMWARE_PROGRESS: 'ui-firmware-progress',

  /** connect is waiting for device to be automatically reconnected */
  FIRMWARE_RECONNECT: 'ui-firmware_reconnect',

  DEVICE_NEEDS_BACKUP: 'ui-device_needs_backup',

  REQUEST_UI_WINDOW: 'ui-request_window',
  CLOSE_UI_WINDOW: 'ui-close_window',

  REQUEST_PERMISSION: 'ui-request_permission',
  REQUEST_CONFIRMATION: 'ui-request_confirmation',
  REQUEST_PIN: 'ui-request_pin',
  INVALID_PIN: 'ui-invalid_pin',
  REQUEST_PASSPHRASE: 'ui-request_passphrase',
  REQUEST_PASSPHRASE_ON_DEVICE: 'ui-request_passphrase_on_device',
  INVALID_PASSPHRASE: 'ui-invalid_passphrase',
  CONNECT: 'ui-connect',
  LOADING: 'ui-loading',
  SET_OPERATION: 'ui-set_operation',
  SELECT_DEVICE: 'ui-select_device',
  SELECT_ACCOUNT: 'ui-select_account',
  SELECT_FEE: 'ui-select_fee',
  UPDATE_CUSTOM_FEE: 'ui-update_custom_fee',
  INSUFFICIENT_FUNDS: 'ui-insufficient_funds',
  REQUEST_BUTTON: 'ui-button',
  REQUEST_WORD: 'ui-request_word',

  LOGIN_CHALLENGE_REQUEST: 'ui-login_challenge_request',
  BUNDLE_PROGRESS: 'ui-bundle_progress',
  ADDRESS_VALIDATION: 'ui-address_validation',
  IFRAME_FAILURE: 'ui-iframe_failure'
}

const MNEMONICS = {
  mnemonic_all: 'all all all all all all all all all all all all',
  mnemonic_12: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
  mnemonic_abandon:
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
}

const TREZOR_CONNECT_MANIFEST = {
  email: 'wallet@ambire.com',
  appUrl: 'https://wallet.ambire.com'
}

export const getController = () => {
  TrezorUserEnvLink.on('disconnected', () => {
    console.error('TrezorUserEnvLink WS disconnected')
  })

  return TrezorUserEnvLink
}

export const setup = async (trezorUserEnvLink, options) => {
  await trezorUserEnvLink.connect()

  if (!options) {
    return true
  }

  await trezorUserEnvLink.api.stopEmu()
  await trezorUserEnvLink.api.stopBridge()

  if (!options.mnemonic) return true

  await trezorUserEnvLink.api.startEmu(options)

  const mnemonic =
    typeof options.mnemonic === 'string' && options.mnemonic.indexOf(' ') > 0
      ? options.mnemonic
      : MNEMONICS[options.mnemonic] || MNEMONICS.mnemonic_all

  await trezorUserEnvLink.api.setupEmu({
    ...options,
    mnemonic,
    pin: options.pin || '',
    passphrase_protection: !!options.passphrase_protection,
    label: options.label || 'TrezorT',
    needs_backup: false
  })

  if (options.settings) {
    try {
      await trezorUserEnvLink.send({ type: 'emulator-apply-settings', ...options.settings })
    } catch (e) {
      console.warn('Setup apply settings failed', options.settings, e.message)
    }
  }

  // eslint-disable-next-line no-param-reassign
  trezorUserEnvLink.state = options

  await trezorUserEnvLink.api.startBridge()
}

export const initTrezorConnect = async (trezorUserEnvLink, options?) => {
  TrezorConnect.removeAllListeners()

  TrezorConnect.on('device-connect', (device) => {
    if (!device.features) {
      throw new Error('Device features not available')
    }
  })

  TrezorConnect.on(UI.REQUEST_CONFIRMATION, () => {
    TrezorConnect.uiResponse({
      type: UI.RECEIVE_CONFIRMATION,
      payload: true
    })
  })

  TrezorConnect.on(UI.REQUEST_BUTTON, () => {
    setTimeout(() => trezorUserEnvLink.send({ type: 'emulator-press-yes' }), 1)
  })

  await TrezorConnect.init({
    manifest: TREZOR_CONNECT_MANIFEST,
    transports: ['BridgeTransport'],
    debug: false,
    popup: false,
    pendingTransportEvent: true,
    // connectSrc: process.env.TREZOR_CONNECT_SRC,
    ...options
  })
}

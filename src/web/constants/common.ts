import { isWeb } from '@common/config/env'

export const IS_CHROME = /Chrome\//i.test(global.navigator?.userAgent)

export const IS_FIREFOX = /Firefox\//i.test(global.navigator?.userAgent)

export const IS_LINUX = /linux/i.test(global.navigator?.userAgent)

export const IS_WINDOWS = /windows/i.test(global.navigator?.userAgent)

export const EVENTS = {
  broadcastToUI: 'broadcastToUI',
  broadcastToBackground: 'broadcastToBackground',
  TX_COMPLETED: 'TX_COMPLETED',
  SIGN_FINISHED: 'SIGN_FINISHED'
}

// eslint-disable-next-line no-restricted-globals
export const INTERNAL_REQUEST_ORIGIN = isWeb ? location.origin : null

export const INTERNAL_REQUEST_SESSION = {
  name: 'Ambire',
  origin: INTERNAL_REQUEST_ORIGIN,
  icon: '../assets/images/xicon@128.png'
}


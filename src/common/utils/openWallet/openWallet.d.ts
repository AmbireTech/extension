import type { ControllersMiddlewareContextReturnType } from '@common/contexts/controllersMiddlewareContext/types'

/**
 * Opens the wallet - the popup or the side panel, whichever the toolbar action opens - once a
 * flow in an extension tab is done. Meant to run soon after the user's click there.
 */
export declare const openWallet: (
  dispatch: ControllersMiddlewareContextReturnType['dispatch']
) => void

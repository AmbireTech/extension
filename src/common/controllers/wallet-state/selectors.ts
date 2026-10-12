import type { AllControllersMappingType } from '@common/constants/controllersMapping'

// Undefined until the controller's state has arrived (selectors also run from the Router)
type WalletState = AllControllersMappingType['WalletStateController'] | undefined

/** Whether side panel mode is on. False until the controller's state has arrived. */
export const selectIsSidePanelModeEnabled = (state: WalletState) => !!state?.isSidePanelModeEnabled

/** Whether the extension is pinned to the browser toolbar. False until the state has arrived. */
export const selectIsPinned = (state: WalletState) => !!state?.isPinned

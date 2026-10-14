import type { AllControllersMappingType } from '@common/constants/controllersMapping'

// Undefined until the controller's state has arrived (selectors also run from the Router)
type WalletState = AllControllersMappingType['WalletStateController'] | undefined

/** Whether side panel mode is on. False until the controller's state has arrived. */
export const selectIsSidePanelModeEnabled = (state: WalletState) => !!state?.isSidePanelModeEnabled

/** Whether the extension is pinned to the browser toolbar. False until the state has arrived. */
export const selectIsPinned = (state: WalletState) => !!state?.isPinned

/**
 * The side panel mode, or 'loading' until the controller has loaded the stored settings - before
 * that the mode reads as off, whatever it really is.
 */
export const selectSidePanelModeStatus = (state: WalletState): 'loading' | 'on' | 'off' => {
  if (!state?.isReady) return 'loading'

  return state.isSidePanelModeEnabled ? 'on' : 'off'
}

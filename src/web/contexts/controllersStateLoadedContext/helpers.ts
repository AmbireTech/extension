/**
 * Checks if a controller state is loaded and ready, handling all possible loaded state patterns.
 */
export const isStateLoaded = (state: any): boolean => {
  if (!state || !Object.keys(state).length) return false
  if ('isReady' in state) return state.isReady === true
  return true
}

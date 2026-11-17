// The mobile screen stack registers a handler here, so code above it (the onboarding
// navigation) can go back exactly as a swipe does: one screen, however many history
// entries that screen owns. Nothing registers it where there is no stack (web).
const state: { goBack: (() => boolean) | null } = { goBack: null }

export const setStackGoBackHandler = (handler: (() => boolean) | null) => {
  state.goBack = handler
}

// Returns whether the stack went back - it does not when there is no screen below.
export const goBackInStack = () => state.goBack?.() ?? false

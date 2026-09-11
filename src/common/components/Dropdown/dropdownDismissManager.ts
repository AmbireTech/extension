// Singleton manager for dropdown dismiss-on-outside-touch (mobile).
// The app root observes every touch through the bubbling `onTouchStart`, which does not take part in
// responder negotiation, and calls `checkDropdownDismiss()`. That is what makes the tap pass through:
// unlike a full-screen overlay, it closes the dropdown while the touch still reaches whatever is
// underneath, so a button outside fires on the first tap and a list scrolls right away.
// The open Dropdown registers a callback that closes it unless the touch started inside itself.

type DismissCheck = () => void

let activeDismissCheck: DismissCheck | null = null

export const registerDropdownDismiss = (check: DismissCheck) => {
  activeDismissCheck = check
}

// Takes the callback back so a dropdown that closes late cannot unregister another one's check
export const unregisterDropdownDismiss = (check: DismissCheck) => {
  if (activeDismissCheck === check) activeDismissCheck = null
}

export const checkDropdownDismiss = () => {
  activeDismissCheck?.()
}

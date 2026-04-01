// Singleton manager for dropdown dismiss-on-outside-touch.
// The root GestureHandler calls `checkDropdownDismiss(x, y)` on every touch.
// Active Dropdown registers a callback that checks bounds and closes if outside.

type DismissCheck = (absoluteX: number, absoluteY: number) => void

let activeDismissCheck: DismissCheck | null = null

export const registerDropdownDismiss = (check: DismissCheck) => {
  activeDismissCheck = check
}

export const unregisterDropdownDismiss = () => {
  activeDismissCheck = null
}

export const checkDropdownDismiss = (absoluteX: number, absoluteY: number) => {
  activeDismissCheck?.(absoluteX, absoluteY)
}

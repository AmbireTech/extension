import { createContext, useContext, useMemo } from 'react'

type BottomSheetContextValue = {
  isInsideBottomSheet: boolean
  /** Whether the sheet the content sits in is currently up. */
  isOpen: boolean
}

export const BottomSheetContext = createContext<BottomSheetContextValue>({
  isInsideBottomSheet: false,
  isOpen: false
})

export const useIsInsideBottomSheet = () => useContext(BottomSheetContext).isInsideBottomSheet

/**
 * Whether the sheet the caller is rendered in is open. The content is mounted with the screen
 * rather than when the sheet opens, so anything that should happen as the sheet comes up - a
 * biometric prompt, focusing a field - has to wait for this instead of for its own mount.
 */
export const useIsBottomSheetOpen = () => useContext(BottomSheetContext).isOpen

/** Memoized so the content below does not re-render on every render of the sheet. */
export const useBottomSheetContextValue = (isOpen: boolean): BottomSheetContextValue =>
  useMemo(() => ({ isInsideBottomSheet: true, isOpen }), [isOpen])

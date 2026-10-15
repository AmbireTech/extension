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
 * Whether the sheet the caller sits in is open. Sheet content mounts with the screen, so
 * anything that must happen as the sheet comes up waits for this, not for its own mount.
 */
export const useIsBottomSheetOpen = () => useContext(BottomSheetContext).isOpen

/** Memoized so the content below does not re-render on every render of the sheet. */
export const useBottomSheetContextValue = (isOpen: boolean): BottomSheetContextValue =>
  useMemo(() => ({ isInsideBottomSheet: true, isOpen }), [isOpen])

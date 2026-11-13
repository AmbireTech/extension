import { createContext, useContext, useMemo } from 'react'

type BottomSheetContextValue = {
  isInsideBottomSheet: boolean
  /** Whether the sheet the content sits in is currently up. */
  isOpen: boolean
  /** Whether the sheet was opened from another sheet, which it returns to when closed. */
  isNested: boolean
  /** Closes the sheet. Missing when the sheet can't be closed by the user. */
  close?: () => void
}

export const BottomSheetContext = createContext<BottomSheetContextValue>({
  isInsideBottomSheet: false,
  isOpen: false,
  isNested: false
})

export const useIsInsideBottomSheet = () => useContext(BottomSheetContext).isInsideBottomSheet

/**
 * Whether the sheet the caller sits in is open. Sheet content mounts with the screen, so
 * anything that must happen as the sheet comes up waits for this, not for its own mount.
 */
export const useIsBottomSheetOpen = () => useContext(BottomSheetContext).isOpen

/** The sheet the caller sits in: whether it is nested and how to close it. */
export const useBottomSheet = () => useContext(BottomSheetContext)

/** Memoized so the content below does not re-render on every render of the sheet. */
export const useBottomSheetContextValue = (
  isOpen: boolean,
  isNested = false,
  close?: () => void
): BottomSheetContextValue =>
  useMemo(() => ({ isInsideBottomSheet: true, isOpen, isNested, close }), [isOpen, isNested, close])

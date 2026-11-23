import { useCallback, useRef } from 'react'

/** What a sheet's ref holds once the sheet is mounted: the way to open and close it. */
export type SheetRef = {
  open: () => void
  close: () => void
}

/**
 * The ref to give a `BottomSheet` as `sheetRef`, with stable callbacks that open and close it.
 * Calling them before the sheet is mounted does nothing.
 */
const useSheetRef = () => {
  const ref = useRef<SheetRef>(null)
  const open = useCallback(() => ref.current?.open(), [])
  const close = useCallback(() => ref.current?.close(), [])

  return { ref, open, close }
}

export default useSheetRef

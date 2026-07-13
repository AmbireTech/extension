import { useSyncExternalStore } from 'react'
import { BehaviorSubject, Subject } from 'rxjs'

// Event stream that gets triggered when we want to close all bottom sheets
export const bottomSheetCloseEventStream = new Subject<void>()

// Keeps track of the number of currently open bottom sheets globally
export const openBottomSheetsCount = new BehaviorSubject<number>(0)

// Reactive accessor for the number of currently open bottom sheets/modals.
// Unlike reading `openBottomSheetsCount.value` directly, this re-renders the
// consumer whenever the count changes.
export const useOpenBottomSheetsCount = () =>
  useSyncExternalStore(
    (onChange) => {
      const subscription = openBottomSheetsCount.subscribe(onChange)

      return () => subscription.unsubscribe()
    },
    () => openBottomSheetsCount.value
  )

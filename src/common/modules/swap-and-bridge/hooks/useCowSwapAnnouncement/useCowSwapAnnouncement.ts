import { useSyncExternalStore } from 'react'

import { captureException } from '@common/config/analytics/CrashAnalytics'
import { storage } from '@common/services/storage'

const COW_SWAP_ANNOUNCEMENT_DISMISSED_STORAGE_KEY = 'cowSwapAnnouncementDismissed'

// Shared across all consumers (dashboard "New" badge and the Swap & Bridge card),
// so dismissing the card hides the badge without a reload. `null` means not loaded yet.
let isDismissed: boolean | null = null
let hasStartedLoading = false
const listeners = new Set<() => void>()

const notifyListeners = () => listeners.forEach((listener) => listener())

const loadDismissedFlag = () => {
  if (hasStartedLoading) return
  hasStartedLoading = true

  storage
    .get(COW_SWAP_ANNOUNCEMENT_DISMISSED_STORAGE_KEY, false)
    .then((storedValue) => {
      // The user may have dismissed it while the storage read was in flight
      if (isDismissed === null) isDismissed = !!storedValue
    })
    .catch((error) => {
      console.error('Failed to load cowSwapAnnouncementDismissed', error)
      captureException(error)
      // Prefer not showing the announcement over showing it on every visit
      isDismissed = true
    })
    .finally(notifyListeners)
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  loadDismissedFlag()

  return () => {
    listeners.delete(listener)
  }
}

const getIsAnnouncementVisible = () => isDismissed === false

const dismissCowSwapAnnouncement = () => {
  isDismissed = true
  notifyListeners()

  storage.set(COW_SWAP_ANNOUNCEMENT_DISMISSED_STORAGE_KEY, true).catch((error) => {
    console.error('Failed to persist cowSwapAnnouncementDismissed', error)
    captureException(error)
  })
}

/**
 * Temporary announcement of the CoW Swap integration. Visible until the user
 * acknowledges the announcement card on the Swap & Bridge screen.
 */
const useCowSwapAnnouncement = () => {
  const isCowSwapAnnouncementVisible = useSyncExternalStore(subscribe, getIsAnnouncementVisible)

  return { isCowSwapAnnouncementVisible, dismissCowSwapAnnouncement }
}

export default useCowSwapAnnouncement

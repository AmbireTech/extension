import React, { createContext, useCallback, useEffect, useMemo, useRef } from 'react'

import useLeaderboardContext from '@legends/hooks/useLeaderboardContext'
import useLegendsContext from '@legends/hooks/useLegendsContext'
import usePortfolioControllerState from '@legends/hooks/usePortfolioControllerState/usePortfolioControllerState'

type DataPollingContextType = {
  startPolling: () => void
  stopPolling: () => void
}

const DataPollingContext = createContext<DataPollingContextType>({
  startPolling: () => {},
  stopPolling: () => {}
})

const POLLING_INTERVAL = 60000 // 1 min
// Defines the minimum time interval that must pass since the last refresh
// before triggering a new update when switching from an inactive to an active tab.
// Ensures that contexts are refreshed immediately but avoids redundant updates if the last refresh was recent.
const VISIBLE_TAB_MIN_CACHE_TIME = 10000 // 10 sec

// If you want to debug a polling-related issue
// or simply monitor when and how polling is activated, set `IS_DEBUGGING` to `true`.
// This will enable extensive logs in the dev console.
const IS_DEBUGGING = false

const log = (...args: any[]) => {
  if (IS_DEBUGGING) {
    // eslint-disable-next-line no-console
    console.info('ℹ️ DataPollingContext:', ...args)
  }
}

// A common context for auto polling and updating the app state.
// On every POLLING_INTERVAL, it updates the app state by calling the get methods of the contexts we have.
// When the tab is hidden, we stop the timer/updates to avoid making unnecessary calls to the API.
// Once the tab becomes active, we update the app state (if it hasn't been updated in the last VISIBLE_TAB_MIN_CACHE_TIME seconds).
const DataPollingContextProvider: React.FC<any> = ({ children }) => {
  const { updateLeaderboard } = useLeaderboardContext()
  const { getLegends } = useLegendsContext()
  const { updateAccountPortfolio } = usePortfolioControllerState()

  // Polling timeout id
  const pollingIntervalRef: any = useRef(null)
  // On initial load, we assume that the data has already been fetched from other contexts,
  // which is why we set the `receivedAt` timestamp.
  const lastPollReceivedAtRef: any = useRef(Date.now())
  // Flag to track whether we are currently polling
  // More details are provided where the flag is used for better understanding
  const isPollingRef = useRef<boolean>(false)

  const latestStateRef = useRef<{
    updateLeaderboard: typeof updateLeaderboard
    getLegends: typeof getLegends
    updateAccountPortfolio: typeof updateAccountPortfolio
  }>({
    updateLeaderboard,
    getLegends,
    updateAccountPortfolio
  })

  // Mechanism for keeping the context values up-to-date.
  // This is necessary because, on component mount or visibility change,
  // we need to activate polling once.
  // We cannot add `startPolling` as a dependency to the `componentDidMount` hook
  // because every context change would cause the hook to re-render and multiple intervals to be created.
  //
  // Similarly, we cannot define dependencies for the `startPolling` function because its inner `poll` function
  // is a closure that "caches" the dependencies at the time the polling is scheduled, rather than when it is executed.
  //
  // As a solution, we created `latestStateRef`, which gets updated on every dependency change.
  // The `poll` closure then relies on the values in the reference, ensuring they are always up-to-date.
  useEffect(() => {
    latestStateRef.current = {
      updateLeaderboard,
      getLegends,
      updateAccountPortfolio
    }
  }, [updateLeaderboard, getLegends, updateAccountPortfolio])

  // Activates polling.
  // If `forceStart` is set, it fetches the data immediately and schedules the next polling cycle.
  // If omitted, it only schedules the initial data polling.
  const startPolling = useCallback((forceStart = false) => {
    const poll = async () => {
      const context = latestStateRef.current

      if (isPollingRef.current) {
        log('Skipping this iteration, as polling is already active!')
        return
      }

      isPollingRef.current = true

      log('Fetching data', Date.now())
      try {
        await Promise.all([
          context.updateLeaderboard(),
          context.getLegends(),
          context.updateAccountPortfolio()
        ])

        lastPollReceivedAtRef.current = Date.now()
      } catch (error) {
        // For now, in case of a context update failure during polling, we simply reschedule the next polling,
        // as each context has its own error handling.
        // eslint-disable-next-line no-console
        console.error('An error occurred while polling the latest character data:', error)
      }

      // Why do we need the `isPollingRef` flag instead of relying solely on `pollingIntervalRef`?
      // There are 2 reasons:
      // #1. Initially, we relied on `pollingIntervalRef` and expected that only one interval would run at a time
      //     because we called `clearTimeout` before starting a new interval.
      //     HOWEVER, since the `poll` function is asynchronous, if `startPolling` is invoked multiple times
      //     within a short period, a new interval can be created before the previous one resolves.
      //     This happens because the `poll` function fetches data asynchronously and, upon resolving,
      //     starts a new interval as it is a recursive function.
      //     To address this issue, we added a synchronous flag (`isPollingRef`) to prevent `startPolling`
      //     from being called twice while an ongoing interval exists.
      // #2. If we call `stopInterval` while an ongoing `poll` execution is in progress,
      //     the subsequent lines in the `poll` function will still execute.
      //     In this case, we need a mechanism to prevent `startPolling` from being called recursively,
      //     and `isPollingRef` solves this issue.
      if (isPollingRef.current) {
        isPollingRef.current = false
        startPolling()
      }
    }

    log('Scheduling next interval!', Date.now())

    // Clear active timeout, if there
    clearTimeout(pollingIntervalRef.current)
    pollingIntervalRef.current = setTimeout(poll, forceStart ? 0 : POLLING_INTERVAL)
  }, []) // Intentionally empty dependency array

  const stopPolling = useCallback(() => {
    clearTimeout(pollingIntervalRef.current)
    pollingIntervalRef.current = null
    isPollingRef.current = false
    log('Polling stopped!', Date.now())
  }, [])

  useEffect(() => {
    // Schedule initial polling on mount
    startPolling()

    const handleVisibilityChange = () => {
      // Gotcha: `document.visibilityState === 'visible'` is also triggered when switching to the Legends tab from another tab,
      // but only if the context was unmounted and then remounted (remount happens in the case you switch the character).
      // This isn't an issue for us since we prevent multiple intervals from being scheduled simultaneously,
      // but it's something to keep in mind.
      if (document.visibilityState === 'visible') {
        // Refresh data immediately when the tab becomes active if `VISIBLE_TAB_MIN_CACHE_TIME` has passed.
        // Otherwise, schedule the next update using `POLLING_INTERVAL`.
        const forcePolling = Date.now() - lastPollReceivedAtRef.current > VISIBLE_TAB_MIN_CACHE_TIME
        startPolling(forcePolling)
      } else {
        // Stop polling, when the tab is hidden
        stopPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [startPolling, stopPolling])

  const contextValue = useMemo(() => ({ startPolling, stopPolling }), [startPolling, stopPolling])

  return <DataPollingContext.Provider value={contextValue}>{children}</DataPollingContext.Provider>
}

export { DataPollingContextProvider, DataPollingContext }

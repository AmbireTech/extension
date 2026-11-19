import { useEffect, useMemo, useState } from 'react'

import {
  getWcSessionDetails,
  pingWcSession
} from '@mobile/modules/wallet-connect/services/walletConnectService'

import type { WcSessionDetails, WcSessionStatus } from './types'

const PING_TIMEOUT_MS = 8_000

const useWcSessionsDetails = (topics: string[]) => {
  // A string key, so a new array with the same sessions doesn't refetch or ping again
  const topicsKey = topics.join(',')
  const [statuses, setStatuses] = useState<Record<string, WcSessionStatus>>({})

  useEffect(() => {
    let isCurrent = true
    topicsKey
      .split(',')
      .filter(Boolean)
      .forEach((topic) => {
        pingWcSession(topic, PING_TIMEOUT_MS)
          .then((isActive) => {
            if (isCurrent)
              setStatuses((prev) => ({ ...prev, [topic]: isActive ? 'active' : 'inactive' }))
          })
          .catch((e) => console.error('[WalletConnect] Failed to check a session:', e))
      })

    return () => {
      isCurrent = false
    }
  }, [topicsKey])

  return useMemo(
    () =>
      Object.fromEntries(
        topicsKey
          .split(',')
          .filter(Boolean)
          .map((topic): [string, WcSessionDetails] => {
            const details = getWcSessionDetails(topic)
            return [
              topic,
              {
                connectedAt: details?.connectedAt,
                expiresInSeconds: details?.expiresInSeconds,
                status: statuses[topic] ?? 'checking'
              }
            ]
          })
      ),
    [topicsKey, statuses]
  )
}

export default useWcSessionsDetails

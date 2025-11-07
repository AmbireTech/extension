import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { RELAYER_URL } from '@env'
import useAccountContext from '@legends/hooks/useAccountContext'

import { ActivityResponse } from './types'

type ActivityContextType = {
  activity: ActivityResponse | null
  isLoading: boolean
  error: string | null
  getActivity: () => Promise<ActivityResponse | null>
  currentPage: number
  setPage: (page: number) => void
}

const ActivityContext = createContext<ActivityContextType>({} as ActivityContextType)

const ActivityContextProvider: React.FC<any> = ({ children }) => {
  const [currentPage, setPage] = useState(0)
  const { connectedAccount } = useAccountContext()
  const [activity, setActivity] = useState<ActivityResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getActivity = useCallback(async () => {
    try {
      if (!connectedAccount) return null

      setIsLoading(true)

      const activityResponse = await fetch(
        `${RELAYER_URL}/legends/activity/${connectedAccount}/latest?page=${currentPage}`
      )
      if (!activityResponse.ok) {
        throw new Error('Failed to fetch Character activity!')
      }

      const response = await activityResponse.json()

      setActivity(response)
      setError(null)
      setIsLoading(false)

      return response as ActivityResponse
    } catch (e) {
      setActivity(null)

      console.error(e)
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [connectedAccount, currentPage])

  useEffect(() => {
    getActivity().catch(() =>
      setError("Couldn't fetch Character's activity! Please try again later!")
    )
  }, [getActivity, currentPage])

  const contextValue = useMemo(
    () => ({ activity, isLoading, error, getActivity, currentPage, setPage }),
    [activity, isLoading, error, getActivity, currentPage, setPage]
  )

  return <ActivityContext.Provider value={contextValue}>{children}</ActivityContext.Provider>
}

export { ActivityContextProvider, ActivityContext }

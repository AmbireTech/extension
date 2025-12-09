import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { RELAYER_URL } from '@env'
import useAccountContext from '@legends/hooks/useAccountContext'
import useLeaderboardContext from '@legends/hooks/useLeaderboardContext'
import useToast from '@legends/hooks/useToast'
import { CardFromResponse, CardStatus } from '@legends/modules/legends/types'
import { sortCards } from '@legends/modules/legends/utils'

type LegendsContextType = {
  legends: CardFromResponse[]
  isLoading: boolean
  error: string | null
  getLegends: () => Promise<void>
  onLegendComplete: () => Promise<void>
}

const legendsContext = createContext<LegendsContextType>({} as LegendsContextType)

const LegendsContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { connectedAccount, nonV2Account } = useAccountContext()
  const { addToast } = useToast()
  const { updateLeaderboard } = useLeaderboardContext()
  const noConnectionAcc = Boolean(!connectedAccount || nonV2Account)
  const [legendsAcc, setLegendsAcc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [legends, setLegends] = useState<CardFromResponse[]>([])

  const completedCount = useMemo(
    () => legends.filter((card) => card.card.status === CardStatus.completed).length,
    [legends]
  )

  const getLegends = useCallback(async () => {
    setError(null)

    if (legendsAcc !== connectedAccount) {
      setIsLoading(true)
    }
    try {
      const rawCards = await fetch(
        `${RELAYER_URL}/legends/cards${!noConnectionAcc ? `?identity=${connectedAccount}` : ''}`
      )
      const cards = await rawCards.json()
      const sortedCards = sortCards(cards)
      setLegendsAcc(connectedAccount)
      setLegends(sortedCards)
    } catch (e: any) {
      console.error(e)
      setError('Internal error while fetching quests. Please reload the page or try again later.')
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [connectedAccount, legendsAcc, noConnectionAcc])

  useEffect(() => {
    getLegends().catch(() => {
      setError('Internal error while fetching quests. Please reload the page or try again later.')
    })
  }, [getLegends])

  const onLegendComplete = useCallback(async () => {
    const [activityResult, legendsResult] = await Promise.allSettled([
      getLegends(),
      updateLeaderboard()
    ])
    const hasActivityFailed = activityResult.status === 'rejected'
    const hasLegendsFailed = legendsResult.status === 'rejected'

    // No need to bombard the user with three toast if the relayer is down
    if (hasActivityFailed && hasLegendsFailed) {
      addToast('An error occurred while completing the legend. Please try again later.', {
        type: 'error'
      })
      return
    }

    // Handle errors based on the index of each result
    if (activityResult.status === 'rejected') {
      addToast(
        'Your latest activity cannot be retrieved. Please refresh the page to see the latest data.',
        { type: 'error' }
      )
    }

    if (legendsResult.status === 'rejected') {
      addToast('We cannot retrieve your legends at the moment. Please refresh the page.', {
        type: 'error'
      })
    }
  }, [addToast, getLegends, updateLeaderboard])

  const contextValue: LegendsContextType = useMemo(
    () => ({
      legends,
      isLoading,
      setIsLoading,
      error,
      completedCount,
      getLegends,
      onLegendComplete
    }),
    [legends, isLoading, setIsLoading, error, completedCount, getLegends, onLegendComplete]
  )

  return <legendsContext.Provider value={contextValue}>{children}</legendsContext.Provider>
}

export { LegendsContextProvider, legendsContext }

import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { RELAYER_URL } from '@env'
import useAccountContext from '@legends/hooks/useAccountContext'
import useCharacterContext from '@legends/hooks/useCharacterContext'
import useRecentActivityContext from '@legends/hooks/useRecentActivityContext'
import useToast from '@legends/hooks/useToast'
import { isWheelSpinTodayDone } from '@legends/modules/legends/components/WheelComponentModal/helpers'
import { CardFromResponse, CardStatus } from '@legends/modules/legends/types'
import { sortCards } from '@legends/modules/legends/utils'

type LegendsContextType = {
  legends: CardFromResponse[]
  isLoading: boolean
  error: string | null
  completedCount: number
  getLegends: () => Promise<void>
  wheelSpinOfTheDay: boolean
  onLegendComplete: () => Promise<void>
}

const legendsContext = createContext<LegendsContextType>({} as LegendsContextType)

const LegendsContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { connectedAccount } = useAccountContext()
  const { addToast } = useToast()
  const { getCharacter } = useCharacterContext()
  const { getActivity } = useRecentActivityContext()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [legends, setLegends] = useState<CardFromResponse[]>([])

  const completedCount = useMemo(
    () => legends.filter((card) => card.card.status === CardStatus.completed).length,
    [legends]
  )

  const wheelSpinOfTheDay = useMemo(() => isWheelSpinTodayDone({ legends }), [legends])

  const getLegends = useCallback(async () => {
    setError(null)
    try {
      const rawCards = await fetch(`${RELAYER_URL}/legends/cards?identity=${connectedAccount}`)

      const cards = await rawCards.json()
      const sortedCards = sortCards(cards)
      setLegends(sortedCards)
    } catch (e: any) {
      console.error(e)
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [connectedAccount])

  useEffect(() => {
    getLegends().catch(() => {
      setError('Internal error while fetching legends. Please reload the page or try again later.')
    })
  }, [getLegends])

  const onLegendComplete = useCallback(async () => {
    const [activityResult, legendsResult, characterResult] = await Promise.allSettled([
      getActivity(),
      getLegends(),
      getCharacter()
    ])
    const hasActivityFailed = activityResult.status === 'rejected'
    const hasLegendsFailed = legendsResult.status === 'rejected'
    const hasCharacterFailed = characterResult.status === 'rejected'

    // No need to bombard the user with three toast if the relayer is down
    if (hasActivityFailed && hasLegendsFailed && hasCharacterFailed) {
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

    if (characterResult.status === 'rejected') {
      addToast(
        'Your XP has been successfully gained, but there was an error retrieving it. Please refresh the page to see the latest XP.',
        { type: 'error' }
      )
    }
  }, [addToast, getActivity, getCharacter, getLegends])

  const contextValue: LegendsContextType = useMemo(
    () => ({
      legends,
      isLoading,
      error,
      completedCount,
      getLegends,
      onLegendComplete,
      wheelSpinOfTheDay
    }),
    [legends, isLoading, error, completedCount, getLegends, onLegendComplete, wheelSpinOfTheDay]
  )

  return <legendsContext.Provider value={contextValue}>{children}</legendsContext.Provider>
}

export { LegendsContextProvider, legendsContext }

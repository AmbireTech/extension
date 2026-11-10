import { useCallback, useEffect, useState } from 'react'

import { fetchWithRelayerCustomHeaders } from '@common/utils/relayerCustomHeaders'
import { RELAYER_URL } from '@env'
import { ActivityResponse } from '@legends/contexts/activityContext/types'

type Props = {
  page: number | null
  accountAddress: string | null
}

const useActivity = ({ page, accountAddress }: Props) => {
  const [activity, setActivity] = useState<ActivityResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getActivity = useCallback(async () => {
    try {
      if (!accountAddress) return null
      if (!isLoading) setIsLoading(true)

      const activityResponse = await fetchWithRelayerCustomHeaders(
        `${RELAYER_URL}/legends/activity/${accountAddress}?page=${page}`
      )
      if (!activityResponse.ok) {
        throw new Error('Failed to fetch Character activity!')
      }

      const response = await activityResponse.json()

      setActivity(response)
      setError(null)

      return response as ActivityResponse
    } catch (e) {
      setActivity(null)

      console.error(e)
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [accountAddress, page])

  useEffect(() => {
    if (page !== null) {
      getActivity().catch(() =>
        setError("Couldn't fetch Character's activity! Please try again later!")
      )
    } else {
      setActivity(null)
      setError(null)
    }
  }, [getActivity, page])

  return {
    activity,
    isLoading,
    error,
    getActivity
  }
}

export default useActivity

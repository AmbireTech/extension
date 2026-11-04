import { fetchWithRelayerCustomHeaders } from '@common/utils/relayerCustomHeaders'
import { RELAYER_URL } from '@env'
import { ActivityResponse } from '@legends/contexts/activityContext/types'

const getRecentActivity = async (connectedAccount: string) => {
  const page = 0
  try {
    if (!connectedAccount) return null

    const activityResponse = await fetchWithRelayerCustomHeaders(
      `${RELAYER_URL}/legends/activity/${connectedAccount}?page=${page}`
    )

    if (!activityResponse.ok) {
      throw new Error('Failed to fetch Character recent activity!')
    }

    const response = await activityResponse.json()

    return response as ActivityResponse
  } catch (e) {
    console.error(e)
    throw e
  }
}

export default getRecentActivity

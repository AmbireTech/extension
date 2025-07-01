import { RELAYER_URL } from '@env'
import { LeaderboardResponse } from '@legends/modules/leaderboard/types'

export const getLeaderboard = async (
  currentUser?: string
): Promise<LeaderboardResponse | undefined> => {
  try {
    const res = await fetch(
      `${RELAYER_URL}/legends/leaderboard${currentUser ? `?identity=${currentUser}` : ''}`
    )
    const body = (await res.json()) as LeaderboardResponse

    if (!body?.season1Leaderboard) throw new Error('Invalid response')

    return body
  } catch (e) {
    console.error('Error fetching leaderboard', e)
    throw e
  }
}

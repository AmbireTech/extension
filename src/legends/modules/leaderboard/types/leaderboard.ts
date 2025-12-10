type LeaderboardEntry = {
  entries: Array<{
    rank: number
    account: string
    level?: number
    xp: number
    weight?: number
    projectedRewards?: number
    image: string
    image_avatar: string
    reward?: number
  }>
  currentUser: {
    rank: number
    account: string
    level?: number
    xp: number
    weight?: number
    projectedRewards?: number
    image: string
    image_avatar: string
  }
}

interface LeaderboardResponse {
  fullLeaderboard: LeaderboardEntry
  season0Leaderboard: LeaderboardEntry
  season1Leaderboard: LeaderboardEntry
}

export type { LeaderboardEntry, LeaderboardResponse }

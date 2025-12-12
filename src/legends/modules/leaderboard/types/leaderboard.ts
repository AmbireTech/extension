type LeaderboardEntry = {
  entries: Array<{
    rank: number
    account: string
    level?: number
    xp?: number
    weight?: number
    projectedRewards?: number
    projectedRewardsInUsd?: number
    image?: string
    image_avatar?: string
    reward?: number
    points?: number
  }>
  currentUser: {
    rank: number
    account: string
    level?: number
    xp?: number
    weight?: number
    projectedRewards?: number
    projectedRewardsInUsd?: number
    image?: string
    image_avatar?: string
    points?: number
  }
}

interface LeaderboardResponse {
  fullLeaderboard: LeaderboardEntry
  season0Leaderboard: LeaderboardEntry
  season1Leaderboard: LeaderboardEntry
  season2Leaderboard: LeaderboardEntry
}

export type { LeaderboardEntry, LeaderboardResponse }

import { ProjectedRewardsStats } from '@ambire-common/libs/portfolio/interfaces'
import { LeaderboardEntry } from '@legends/modules/leaderboard/types'

/**
 * in season 2 the score is calculated on the basis of data we fetch weekly
 * new users should dno't wait a week until they see a score, based on their balance, liquidity,staked WALLET
 * That is why we get the current balance/liquidity/stkWALLET of the user, so we can display at least
 * some example points 'as if' they were included in last week's snapshot we executed on the relayer
 * But since that data is not available in the relayer at the current time, it is not able to place
 * the current user in the appropriate place in the leaderboard
 * this function combines the leaderboard from the relayer and the live data only the client has
 * and reorders the leaderboard so 1) the score the user sees on the home page and the one in
 * the leaderboard matches and 2) the ordering is correct with the new data
 * @param {LeaderboardEntry} leaderboardData leaderboard from relayer
 * @param {ProjectedRewardsStats | null} userRewardsStats live stats of current account for getting projected rewards
 * @param {string | null} account Current account address
 * @returns {LeaderboardEntry} Reordered leaderboard with live data for current user
 */
export function reorderLeaderboardWithLiveData(
  leaderboardData: LeaderboardEntry,
  userRewardsStats: ProjectedRewardsStats | null,
  account: string | null
): LeaderboardEntry {
  // if live data is not loaded, do not change the leaderboard from the relayer
  if (!userRewardsStats) return leaderboardData
  // if not connected account, do not change anything
  if (!account) return leaderboardData
  const { totalScore, estimatedRewardsUSD, rank: oldRank, estimatedRewards } = userRewardsStats
  // simply add user to leaderboard and sort
  const newOrderedLeaderboard: LeaderboardEntry['entries'] = [
    ...leaderboardData.entries.filter((e) => e.account !== account),
    {
      rank: 0,
      account,
      points: totalScore,
      projectedRewardsInUsd: estimatedRewardsUSD
    }
  ]
    .sort((a, b) => {
      // sort by points, as expected
      if (typeof b.points === 'number' && typeof a.points === 'number' && b.points - a.points)
        return b.points - a.points
      // sort by alphabetical order of addresses so it is deterministic
      if (b.account > a.account) return -1
      return 1
    })
    // apply new ranks
    .map((a, i) => ({ ...a, rank: i + 1 }))

  let newRankCurrentAcc = newOrderedLeaderboard.find((a) => a.account === account)?.rank
  // we should never enter this if, because the current user will always have rank in the leaderboard,
  // because we added it there manually few lines above
  if (newRankCurrentAcc === undefined) return leaderboardData

  // if the user is not in the chunk if the leaderboard we loaded from the relayer, then we cannot really put a proper rank to it
  if (newRankCurrentAcc > 100) {
    const userIndexInLeaderboardArray = newOrderedLeaderboard.findIndex(
      (e) => e.account === account
    )
    newRankCurrentAcc = oldRank
    if (newOrderedLeaderboard[userIndexInLeaderboardArray]) {
      newOrderedLeaderboard[userIndexInLeaderboardArray].rank = oldRank
      newOrderedLeaderboard[userIndexInLeaderboardArray].points = totalScore
      newOrderedLeaderboard[userIndexInLeaderboardArray].projectedRewards = estimatedRewards
      newOrderedLeaderboard[userIndexInLeaderboardArray].projectedRewardsInUsd = estimatedRewardsUSD
    }
  }
  return {
    entries: newOrderedLeaderboard,
    currentUser: {
      // we add the live data
      rank: newRankCurrentAcc,
      points: totalScore,
      projectedRewards: estimatedRewards,
      projectedRewardsInUsd: estimatedRewardsUSD,
      account
    }
  }
}

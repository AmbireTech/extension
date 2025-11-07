export function getRewardsButtonText({
  connectedAccount,
  v1Account
}: {
  connectedAccount: string | null | undefined
  v1Account: boolean | null | undefined
}): string {
  if (v1Account)
    return 'Switch to a new account to unlock Rewards quests. Ambire legacy Web accounts (V1) are not supported.'
  if (!connectedAccount) return 'Connect your wallet to unlock Rewards quests.'
  return 'Proceed'
}

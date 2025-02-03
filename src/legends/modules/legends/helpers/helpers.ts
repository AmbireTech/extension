import { ToastOptions } from '@common/contexts/toastContext'
import getRecentActivity from '@legends/contexts/activityContext/helpers/recentActivity'
import { ActivityTransaction, LegendActivity } from '@legends/contexts/activityContext/types'

const checkTransactionStatus = async (
  connectedAccount: string | null,
  txAction: string,
  setState: (receivedXp?: number | null) => void,
  addToast: (message: string, options?: ToastOptions) => void,
  showToast: boolean = true
) => {
  try {
    const response = await getRecentActivity(connectedAccount!)

    const today = new Date().toISOString().split('T')[0]
    const transaction: ActivityTransaction | undefined = response?.transactions.find(
      (txn: ActivityTransaction) =>
        txn.submittedAt.startsWith(today) &&
        txn.legends.activities &&
        txn.legends.activities.some(
          (activity: LegendActivity) =>
            activity.action.startsWith(txAction) ||
            activity.action.includes(txAction) ||
            activity.action === txAction
        )
    )

    if (!transaction) return false
    const dailyRewardActivity = transaction.legends.activities.find((activity: any) => {
      return activity.action.includes(txAction)
    })

    if (!dailyRewardActivity) return false

    setState && setState(dailyRewardActivity.xp)
    showToast &&
      addToast(`You received ${dailyRewardActivity.xp}xp!`, {
        type: 'success'
      })
    return true
  } catch (error) {
    console.error('Error fetching transaction status:', error)
    return false
  }
}

export { checkTransactionStatus }

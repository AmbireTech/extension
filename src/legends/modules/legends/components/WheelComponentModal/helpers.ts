import { ActivityTransaction, LegendActivity } from '@legends/contexts/recentActivityContext/types'
import { CardActionType, CardFromResponse, CardStatus } from '@legends/modules/legends/types'

interface WheelSpinOfTheDayParams {
  legends: CardFromResponse[] | null
  activity: ActivityTransaction[] | null
}

export const calculateHoursUntilMidnight = (activity: ActivityTransaction[]) => {
  const submittedAt = activity && activity[0] && activity[0].submittedAt

  const submittedAtOffset = submittedAt
    ? new Date(submittedAt).getTimezoneOffset()
    : new Date().getTimezoneOffset()

  const adjustedNow = new Date(new Date().getTime() - submittedAtOffset * 60000)

  // Calculate hours and minutes left until midnight in the adjusted timezone
  return 23 - adjustedNow.getUTCHours()
}

export const isWheelSpinTodayDone = ({ legends, activity }: WheelSpinOfTheDayParams): boolean => {
  if (!legends || !legends.length) return true
  const today = new Date().toISOString().split('T')[0]

  const cardwheelOfFortune =
    legends.find((card: CardFromResponse) => {
      return (
        card.action.type === CardActionType.predefined &&
        card.action.predefinedId === 'wheelOfFortune' &&
        card.card.status === CardStatus.completed
      )
    }) ||
    (activity && activity.length
      ? (activity.find((txn: ActivityTransaction) => {
          return (
            txn.legends.activities.find((acc: LegendActivity) =>
              acc.action.startsWith('WheelOfFortune')
            ) && txn.submittedAt.startsWith(today)
          )
        }) as unknown as CardFromResponse | null)
      : null)
  return !!cardwheelOfFortune
}

import {
  CardAction,
  CardActionCalls,
  CardActionType,
  CardFromResponse,
  CardStatus
} from '@legends/modules/legends/types'

const sortByHighestXp = (a: CardFromResponse, b: CardFromResponse) => {
  const totalAXp = a.xp.reduce((acc, xp) => acc + (xp?.to || 0) + (xp?.from || 0), 0)
  const totalBXp = b.xp.reduce((acc, xp) => acc + (xp?.to || 0) + (xp?.from || 0), 0)

  return totalBXp - totalAXp
}

export const isMatchingPredefinedId = (legendAction: CardAction, predefinedIdToMatch: string) =>
  legendAction.type === CardActionType.predefined &&
  legendAction.predefinedId === predefinedIdToMatch

const sortCards = (cards: CardFromResponse[]) => {
  return cards.sort((a, b) => {
    const order = {
      [CardStatus.active]: 1,
      [CardStatus.completed]: 2,
      [CardStatus.disabled]: 3
    }

    // Sort by card type
    if (order[a.card.status] !== order[b.card.status]) {
      return order[a.card.status] - order[b.card.status]
    }

    // Sort by highest XP
    return sortByHighestXp(a, b)
  })
}

const handlePredefinedAction = (predefinedId?: string) => {
  if (!predefinedId) {
    alert('Internal error')
    return
  }
  switch (predefinedId) {
    case 'addEOA':
      alert('Add EOA')
      break
    case 'linkX':
      alert('Link X')
      break
    default:
      alert('Unknown action')
  }
  console.log(predefinedId)
}

const handleCallsAction = (calls: CardActionCalls['calls']) => {
  // window.ambire.request(calls)
  console.log(calls)
}

export { sortCards, handlePredefinedAction, handleCallsAction }

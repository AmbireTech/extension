import { CardActionCalls, CardFromResponse, CardStatus } from '@legends/modules/legends/types'

import { CARD_PREDEFINED_ID } from '../constants'

const sortByHighestXp = (a: CardFromResponse, b: CardFromResponse) => {
  const totalAXp = a.xp.reduce((acc, xp) => acc + xp.to + xp.from, 0)
  const totalBXp = b.xp.reduce((acc, xp) => acc + xp.to + xp.from, 0)

  return totalBXp - totalAXp
}

const sortCards = (cards: CardFromResponse[]) => {
  return cards.sort((a, b) => {
    // Display Wheel of Fortune first
    if (a.action.predefinedId === CARD_PREDEFINED_ID.wheelOfFortune) {
      return -1
    }
    if (b.action.predefinedId === CARD_PREDEFINED_ID.wheelOfFortune) {
      return 1
    }

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

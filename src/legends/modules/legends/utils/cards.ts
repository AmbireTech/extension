import { CardAction, CardFromResponse, CardType } from '@legends/modules/legends/types'

import { CARD_PREDEFINED_ID, EOA_ACCESSIBLE_CARDS } from '../constants'

const sortByHighestXp = (a: CardFromResponse, b: CardFromResponse) => {
  const totalAXp = a.xp.reduce((acc, xp) => acc + xp.to + xp.from, 0)
  const totalBXp = b.xp.reduce((acc, xp) => acc + xp.to + xp.from, 0)

  return totalBXp - totalAXp
}

const sortCards = (cards: CardFromResponse[], isConnectedAccountV2: boolean) => {
  return cards
    .map((card) => {
      if (
        (card.action && card.action.calls && card.action.calls.length === 0) ||
        card.action.predefinedId === 'linkX'
      ) {
        return { ...card, disabled: true }
      }
      return card
    })
    .sort((a, b) => {
      // Display EOA/v1 accessible cards first if the account is not v2
      if (!isConnectedAccountV2 && EOA_ACCESSIBLE_CARDS.includes(a.action.predefinedId || '')) {
        return -1
      }
      // Display Wheel of Fortune first
      if (a.action.predefinedId === CARD_PREDEFINED_ID.wheelOfFortune) {
        return -1
      }

      const order = {
        [CardType.available]: 1,
        [CardType.recurring]: 2,
        [CardType.done]: 3
      }

      // Sort by card type
      if (order[a.card.type] !== order[b.card.type]) {
        return order[a.card.type] - order[b.card.type]
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

const handleCallsAction = (calls: CardAction['calls']) => {
  // window.ambire.request(calls)
  console.log(calls)
}

export { sortCards, handlePredefinedAction, handleCallsAction }

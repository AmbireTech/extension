import React, { FC, useState } from 'react'

import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import getRecentActivity from '@legends/contexts/activityContext/helpers/recentActivity'
import useAccountContext from '@legends/hooks/useAccountContext'
import useDataPollingContext from '@legends/hooks/useDataPollingContext'
import useLegendsContext from '@legends/hooks/useLegendsContext'
import useToast from '@legends/hooks/useToast'
import ActionModal from '@legends/modules/legends/components/ActionModal'
import { CardActionType, CardFromResponse, CardStatus } from '@legends/modules/legends/types'

import CardContent from './CardContent'

type Props = {
  cardData: CardFromResponse
}

const Card: FC<Props> = ({ cardData }) => {
  const { card, action } = cardData
  const disabled = card.status === CardStatus.disabled
  const predefinedId = action.type === CardActionType.predefined ? action.predefinedId : ''
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const { onLegendComplete } = useLegendsContext()
  const { connectedAccount, v1Account } = useAccountContext()
  const { addToast } = useToast()
  const { startPolling, stopPolling } = useDataPollingContext()
  const nonConnectedAcc = Boolean(!connectedAccount || v1Account)

  const openActionModal = () => {
    stopPolling()
    setIsActionModalOpen(true)
  }

  const closeActionModal = () => {
    startPolling()
    setIsActionModalOpen(false)
  }

  const pollActivityUntilComplete = async (txnId: string, attempt: number) => {
    if (!connectedAccount) return
    if (attempt > 15) {
      addToast(ERROR_MESSAGES.transactionProcessingFailed, { type: 'error' })
      return
    }

    // We can't rely on state as it's not updated due to the self-invoking nature of the function
    let newActivity

    try {
      newActivity = await getRecentActivity(connectedAccount)
    } catch (error) {
      console.error("Couldn't fetch the recent activity:", error)
    }

    const foundTxn = newActivity?.transactions?.find((txn) => txn.txId === txnId)

    if (!foundTxn) {
      if (attempt === 0) {
        addToast('We are processing your transaction. Expect your reward shortly.')
      }

      await new Promise((res) => {
        setTimeout(() => pollActivityUntilComplete(txnId, attempt + 1).then(res), 1000)
      })
      return
    }

    const latestXpReward = foundTxn.legends.totalXp

    if (latestXpReward) {
      addToast(`Transaction completed! Reward ${latestXpReward} XP`, { type: 'success' })
    } else {
      addToast('Transaction completed!', { type: 'success' })
    }

    // Update all other states
    await onLegendComplete()
  }

  const onLegendCompleteWrapped = async (txnId: string) => {
    await pollActivityUntilComplete(txnId, 0)
  }

  return (
    <>
      {/* Card component */}
      <CardContent
        {...cardData}
        card={card}
        action={action}
        openActionModal={openActionModal}
        disabled={disabled}
        nonConnectedAcc={nonConnectedAcc}
      />
      <ActionModal
        {...cardData}
        isOpen={isActionModalOpen}
        onLegendCompleteWrapped={onLegendCompleteWrapped}
        closeActionModal={closeActionModal}
        action={action}
        predefinedId={predefinedId}
      />
    </>
  )
}

export default React.memo(Card)

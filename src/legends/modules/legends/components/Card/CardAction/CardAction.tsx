import React, { FC, useCallback } from 'react'

import useAccountContext from '@legends/hooks/useAccountContext'
import CardActionButton from '@legends/modules/legends/components/Card/CardAction/actions/CardActionButton'
import { CARD_PREDEFINED_ID } from '@legends/modules/legends/constants'
import { CardAction, CardActionType, CardFromResponse } from '@legends/modules/legends/types'

import { InviteAcc, SendAccOp } from './actions'
import Feedback from './actions/Feedback'

export type CardActionComponentProps = {
  action: CardAction
  buttonText: string
  meta: CardFromResponse['meta']
  id: CardFromResponse['id']
}

const CardActionComponent: FC<CardActionComponentProps> = ({ meta, action, buttonText }) => {
  const { connectedAccount, v1Account } = useAccountContext()
  const disabledButton = Boolean(!connectedAccount || v1Account)

  const handleWalletRouteButtonPress = useCallback(async () => {
    if (action.type !== CardActionType.walletRoute) return

    try {
      await window.ambire.request({
        method: 'open-wallet-route',
        params: { route: action.route }
      })
    } catch (e) {
      console.error(e)
    }
  }, [action])

  if (action.type === CardActionType.predefined) {
    if (action.predefinedId === CARD_PREDEFINED_ID.inviteAccount) {
      return (
        <InviteAcc
          alreadyLinkedAccounts={meta?.alreadyLinkedAccounts || []}
          alreadyInvitedAccounts={meta?.alreadyInvitedAccounts || []}
          usedInvitationSlots={meta?.usedInvitationSlots || 0}
          buttonText={buttonText}
          usersInvitationHistory={meta?.usersInvitationHistory || []}
        />
      )
    }

    if (action.predefinedId === CARD_PREDEFINED_ID.feedback) {
      return <Feedback meta={meta} />
    }

    return null
  }

  if (action.type === CardActionType.calls) {
    return <SendAccOp action={action} />
  }

  if (action.type === CardActionType.link) {
    return (
      <CardActionButton
        buttonText={
          disabledButton
            ? 'Switch to a new account to unlock Rewards quests. Ambire legacy Web accounts (V1) are not supported.'
            : 'Proceed'
        }
        onButtonClick={() => {
          window.open(action.link, '_blank')
        }}
        loadingText=""
        disabled={disabledButton}
      />
    )
  }

  if (action.type === CardActionType.walletRoute && window.ambire) {
    return (
      <CardActionButton
        buttonText={
          disabledButton
            ? 'Switch to a new account to unlock Rewards quests. Ambire legacy Web accounts (V1) are not supported.'
            : 'Proceed'
        }
        onButtonClick={handleWalletRouteButtonPress}
        loadingText=""
        disabled={disabledButton}
      />
    )
  }

  // No specific action type, then we don't need to show an action component (button).
  return null
}

export default CardActionComponent

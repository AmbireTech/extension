import React, { FC, useCallback } from 'react'

import useAccountContext from '@legends/hooks/useAccountContext'
import useCharacterContext from '@legends/hooks/useCharacterContext/useCharacterContext'
import useProviderContext from '@legends/hooks/useProviderContext'
import CardActionButton from '@legends/modules/legends/components/Card/CardAction/actions/CardActionButton'
import { CARD_PREDEFINED_ID } from '@legends/modules/legends/constants'
import { CardAction, CardActionType, CardFromResponse } from '@legends/modules/legends/types'
import { getRewardsButtonText } from '@legends/utils/getRewardsButtonText'

import { InviteAcc, SendAccOp } from './actions'
import BitrefillClaim from './actions/BitrefillClaim'
import Feedback from './actions/Feedback'
import MascotRevealLetter from './actions/MascotRevealLetter'

export type CardActionComponentProps = {
  action: CardAction
  buttonText: string
  meta: CardFromResponse['meta']
  id: CardFromResponse['id']
}

const CardActionComponent: FC<CardActionComponentProps> = ({ meta, action, buttonText }) => {
  const { connectedAccount, v1Account } = useAccountContext()
  const { provider } = useProviderContext()
  const { isCharacterNotMinted } = useCharacterContext()
  const disabledButton = Boolean(!connectedAccount || v1Account || isCharacterNotMinted)

  const getButtonText = () =>
    getRewardsButtonText({
      connectedAccount,
      v1Account: !!v1Account,
      isCharacterNotMinted: !!isCharacterNotMinted
    })

  const handleWalletRouteButtonPress = useCallback(async () => {
    if (action.type !== CardActionType.walletRoute) return
    if (!provider) return
    try {
      await provider.request({
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

    if (action.predefinedId === CARD_PREDEFINED_ID.bitrefill) {
      return <BitrefillClaim meta={meta} />
    }
    if (action.predefinedId === CARD_PREDEFINED_ID.mascot) {
      return <MascotRevealLetter meta={meta} />
    }

    return null
  }

  if (action.type === CardActionType.calls) {
    return <SendAccOp action={action} />
  }

  if (action.type === CardActionType.link) {
    return (
      <CardActionButton
        buttonText={getButtonText()}
        onButtonClick={() => {
          window.open(action.link, '_blank')
        }}
        loadingText=""
        disabled={disabledButton}
      />
    )
  }

  if (action.type === CardActionType.walletRoute && provider) {
    return (
      <CardActionButton
        buttonText={getButtonText()}
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

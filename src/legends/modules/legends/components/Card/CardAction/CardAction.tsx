import React, { FC, useCallback } from 'react'

import useToast from '@legends/hooks/useToast'
import CardActionButton from '@legends/modules/legends/components/Card/CardAction/actions/CardActionButton'
import { CARD_PREDEFINED_ID } from '@legends/modules/legends/constants'
import { CardAction, CardActionType } from '@legends/modules/legends/types'

import LinkAcc from './actions/LinkAcc'
import SendAccOp from './actions/SendAccOp'
import StakeWallet from './actions/StakeWallet'
import SummonAcc from './actions/SummonAcc'
import { CardProps } from './actions/types'

type Props = CardProps & {
  action: CardAction
  buttonText: string
}

const CardActionComponent: FC<Props> = ({ action, buttonText, handleClose, onComplete }) => {
  const { addToast } = useToast()

  const handleWalletRouteButtonPress = useCallback(async () => {
    if (action.type !== CardActionType.walletRoute) return

    try {
      await window.ambire.request({
        method: 'open-wallet-route',
        params: { route: action.route }
      })
    } catch {
      addToast(
        'Unable to open the page: unsupported method by the wallet or permissions not granted',
        'error'
      )
    }
  }, [action, addToast])

  if (action.type === CardActionType.predefined) {
    if (action.predefinedId === CARD_PREDEFINED_ID.addEOA) {
      return <SummonAcc handleClose={handleClose} onComplete={onComplete} buttonText={buttonText} />
    }
    if (action.predefinedId === CARD_PREDEFINED_ID.LinkAccount) {
      return <LinkAcc handleClose={handleClose} onComplete={onComplete} />
    }
    if (action.predefinedId === CARD_PREDEFINED_ID.staking) {
      return <StakeWallet handleClose={handleClose} onComplete={onComplete} />
    }
    if (action.predefinedId === CARD_PREDEFINED_ID.Referral) {
      return null
    }

    return null
  }

  if (action.type === CardActionType.calls) {
    return <SendAccOp handleClose={handleClose} action={action} onComplete={onComplete} />
  }

  if (action.type === CardActionType.link) {
    return (
      <CardActionButton
        buttonText="Proceed"
        onButtonClick={() => {
          window.open(action.link, '_blank')
        }}
        loadingText=""
      />
    )
  }

  if (action.type === CardActionType.walletRoute && window.ambire) {
    return (
      <CardActionButton
        buttonText="Proceed"
        onButtonClick={handleWalletRouteButtonPress}
        loadingText=""
      />
    )
  }

  // No specific action type, then we don't need to show an action component (button).
  return null
}

export default CardActionComponent

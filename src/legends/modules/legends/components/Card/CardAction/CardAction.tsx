import React, { FC } from 'react'

import { CardAction, CardActionType } from '@legends/modules/legends/types'

import SummonEOA from './actions/SummonEOA'

type Props = {
  action: CardAction
  buttonText: string
  onComplete: () => void
}

const CardActionComponent: FC<Props> = ({ action, buttonText, onComplete }) => {
  if (action.type === CardActionType.calls) {
    return <div>TODO: handle calls</div>
  }

  if (action.type === CardActionType.predefined) {
    if (action.predefinedId === 'addEOA') {
      return <SummonEOA onComplete={onComplete} buttonText={buttonText} />
    }

    return <div>Unhandled action predefinedId ${action.predefinedId}</div>
  }

  return <div>Invalid action type</div>
}

export default CardActionComponent

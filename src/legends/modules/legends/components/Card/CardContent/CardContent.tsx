import React, { FC, useMemo } from 'react'

import { CARD_PREDEFINED_ID } from '@legends/modules/legends/constants'
import { CardFromResponse, CardStatus, CardType } from '@legends/modules/legends/types'
import { isMatchingPredefinedId } from '@legends/modules/legends/utils'

import MidnightTimer from '@legends/components/MidnightTimer'
import { timeUntilMidnight } from '../../WheelComponentModal/helpers'
import styles from './CardContent.module.scss'
import Counter from './Counter'
import Flask from './Flask'
import Rewards from './Rewards'

type Props = Pick<
  CardFromResponse,
  'title' | 'description' | 'flavor' | 'xp' | 'image' | 'card' | 'action' | 'timesCollectedToday'
> & {
  openActionModal: () => void
  disabled: boolean
  buttonText: string
}

const CARD_FREQUENCY: { [key in CardType]: string } = {
  [CardType.daily]: 'Daily',
  [CardType.oneTime]: 'One-time',
  [CardType.recurring]: 'Ongoing',
  [CardType.weekly]: 'Weekly'
}

const CardContent: FC<Props> = ({
  title,
  description,
  xp,
  image,
  timesCollectedToday,
  card,
  action,
  openActionModal,
  disabled,
  buttonText
}) => {
  const isCompleted = card.status === CardStatus.completed

  return (
    <div className={`${styles.wrapper} ${disabled && styles.disabled}`}>
      {isCompleted ? (
        <div className={styles.completed}>
          <Flask />
          <div className={styles.completedText}>
            Completed
            {isMatchingPredefinedId(action, CARD_PREDEFINED_ID.wheelOfFortune) ? (
              <MidnightTimer className={styles.completedTextAvailable} />
            ) : null}
          </div>
        </div>
      ) : null}
      <div className={styles.imageAndCounter}>
        <button
          disabled={disabled}
          type="button"
          onClick={openActionModal}
          className={styles.imageButtonWrapper}
        >
          <img src={image} alt={title} className={styles.image} />
        </button>
        <Counter width={48} height={48} count={timesCollectedToday} className={styles.counter} />
      </div>
      <div className={styles.contentAndAction}>
        <div className={styles.content}>
          <h2 className={styles.heading}>{title}</h2>
          <p className={styles.description}>{description}</p>
          <span className={styles.rewardFrequency}>{CARD_FREQUENCY[card.type]}</span>
          <div className={styles.rewards}>
            <Rewards xp={xp} size="sm" reverse />
          </div>
        </div>
        <button
          disabled={disabled}
          className={styles.button}
          type="button"
          onClick={openActionModal}
        >
          {action.type ? buttonText : 'Read more'}
        </button>
      </div>
    </div>
  )
}

export default CardContent

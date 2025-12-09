import React, { FC, useMemo } from 'react'

import LockIcon from '@legends/common/assets/svg/LockIcon'
import smokeAndLights from '@legends/modules/leaderboard/screens/Leaderboard/Smoke-and-lights.png'
import { CardFromResponse, CardStatus, CardType } from '@legends/modules/legends/types'

import styles from './CardContent.module.scss'
import CompletedRibbon from './CompletedRibbon'

type Props = Pick<
  CardFromResponse,
  'shortTitle' | 'xp' | 'imageV2' | 'card' | 'action' | 'timesCollectedToday' | 'id'
> & {
  openActionModal: () => void
  disabled: boolean
  nonConnectedAcc: boolean
}

const CARD_FREQUENCY: { [key in CardType]: string } = {
  [CardType.daily]: 'Daily',
  [CardType.oneTime]: 'One-time',
  [CardType.recurring]: 'Recurring',
  [CardType.weekly]: 'Weekly'
}

const CardContent: FC<Props> = ({
  shortTitle,
  xp,
  imageV2,
  card,
  openActionModal,
  disabled,
  nonConnectedAcc
}) => {
  const isCompleted = card.status === CardStatus.completed

  const FIXED_CARD_FREQUENCY = {
    ...CARD_FREQUENCY,
    [CardType.oneTime]: 'OneTime'
  }

  const xpComponent = useMemo(() => {
    if (!Array.isArray(xp)) return
    if (xp.some((x) => x.linearMultiplier))
      return (
        <>
          <p
            style={{
              color: '#F7BA2F',
              fontWeight: 500
            }}
          >
            Per $100
          </p>
          <span className={styles.xp}>
            {(Math.max(...xp.map((x) => x.linearMultiplier || 0)) * 100).toFixed(2)}
          </span>
        </>
      )
    if (xp.length > 1)
      return (
        <>
          Up to <br />
          <span className={styles.xp}>{Math.max(...xp.map((x) => x.to || 0))}</span>
        </>
      )
    if (xp && xp[0] && xp[0].from !== xp[0].to)
      return (
        <>
          Up to <br />
          <span className={styles.xp}>{xp[0].to}</span>
        </>
      )

    return (
      <>
        Earn <br />
        <span className={styles.xp}>{xp?.[0]?.to}</span>
      </>
    )
  }, [xp])

  return (
    <div
      className={`${styles.wrapper} ${(disabled || isCompleted) && styles.disabled}`}
      role="button"
      onClick={() => {
        if ((!disabled && !isCompleted) || (!disabled && nonConnectedAcc)) {
          openActionModal()
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          openActionModal()
        }
      }}
      tabIndex={0}
    >
      {isCompleted && !nonConnectedAcc ? (
        <div className={styles.overlay}>
          <CompletedRibbon className={styles.overlayIcon} />
        </div>
      ) : null}
      {disabled && (
        <div className={styles.overlay}>
          <LockIcon className={`${styles.overlayIcon} ${styles.disabledIcon}`} />
        </div>
      )}
      <div className={styles.contentAndAction}>
        <div className={styles.content}>
          <h2 className={styles.heading}>{shortTitle}</h2>
          <img src={imageV2} alt="Card" className={styles.image} />
          <div
            className={styles.backgroundEffect}
            style={{
              backgroundImage: `url(${smokeAndLights})`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover'
            }}
          />
        </div>

        <div className={styles.actionAndRewards}>
          <div className={styles.rewardFrequencyWrapper}>
            <span
              className={`${styles.rewardFrequency} ${
                styles[`rewardFrequency${FIXED_CARD_FREQUENCY[card.type]}`]
              }`}
            >
              {CARD_FREQUENCY[card.type]}
            </span>
          </div>
          <div>
            <div className={styles.rewardTitle}>
              {xpComponent}
              <span className={styles.xpText}>XP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardContent

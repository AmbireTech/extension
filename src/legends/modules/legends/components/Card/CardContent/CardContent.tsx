import React, { FC } from 'react'

import LockIcon from '@legends/common/assets/svg/LockIcon'
import { CardFromResponse, CardStatus } from '@legends/modules/legends/types'

import styles from './CardContent.module.scss'
import CompletedRibbon from './CompletedRibbon'
import hoverBackgroundImage from './media/hover-background.png'

type Props = Pick<
  CardFromResponse,
  'shortTitle' | 'imageV2' | 'card' | 'action' | 'timesCollectedToday' | 'id'
> & {
  openActionModal: () => void
  disabled: boolean
  nonConnectedAcc: boolean
}

const CardContent: FC<Props> = ({
  shortTitle,
  imageV2,
  card,
  openActionModal,
  disabled,
  nonConnectedAcc
}) => {
  const isCompleted = card.status === CardStatus.completed

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
      <div className={styles.content}>
        <h2 className={styles.heading}>{shortTitle}</h2>
        <img src={imageV2} alt="Card" className={styles.image} />
        <div
          className={styles.backgroundEffect}
          style={{
            backgroundImage: `url(${hoverBackgroundImage})`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
          }}
        />
      </div>
    </div>
  )
}

export default CardContent

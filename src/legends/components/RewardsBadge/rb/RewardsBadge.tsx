import React, { useRef, useState } from 'react'

import rewardsCoverImg from '@legends/common/assets/images/rewards-cover-image.png'
import useAccountContext from '@legends/hooks/useAccountContext'
import useLegendsContext from '@legends/hooks/useLegendsContext'
import ClaimRewardsModal from '@legends/modules/legends/components/ClaimRewardsModal'
import { CARD_PREDEFINED_ID } from '@legends/modules/legends/constants'
import { isMatchingPredefinedId } from '@legends/modules/legends/utils'

import styles from './RewardsBadge.module.scss'

const RewardsBadge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { connectedAccount } = useAccountContext()

  const { legends } = useLegendsContext()
  const claimWalletCard = legends?.find((card) =>
    isMatchingPredefinedId(card.action, CARD_PREDEFINED_ID.claimRewards)
  )

  const openClaimModal = () => setIsOpen(true)
  const closeClaimModal = () => setIsOpen(false)
  const amountToClaim = claimWalletCard?.meta?.availableToClaim || 0
  if (!connectedAccount || !amountToClaim) return null

  return (
    <div className={styles.rewardsWrapper}>
      <ClaimRewardsModal
        isOpen={isOpen}
        handleClose={closeClaimModal}
        action={claimWalletCard?.action}
        meta={claimWalletCard?.meta}
        card={claimWalletCard?.card}
      />
      <div
        ref={cardRef}
        className={`${styles.rewardsBadgeWrapper} ${styles.active}`}
        aria-label="Open rewards claim modal"
      >
        <div className={styles.rewardsBadge}>
          <div className={styles.rewardsCoverImgWrapper}>
            <img
              src={rewardsCoverImg}
              className={`${styles.rewardsCoverImg}`}
              alt="rewards-cover"
            />
          </div>
          <div className={styles.rewardsInfo}>
            <p className={styles.rewardsTitle}>You can now claim your Season 1 $WALLET rewards </p>
            <div className={styles.amountAndButtonRow}>
              <p className={styles.rewardsAmount}>
                {Math.floor(Number(amountToClaim))
                  .toLocaleString('en-US', { useGrouping: true })
                  .replace(/,/g, ' ')}{' '}
              </p>
              <button
                onKeyDown={(e) => e.key === 'Enter' && openClaimModal()}
                onClick={() => openClaimModal()}
                type="button"
                className={styles.claimButton}
              >
                Claim
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RewardsBadge

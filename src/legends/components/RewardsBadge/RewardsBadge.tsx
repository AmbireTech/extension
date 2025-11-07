import React, { useRef, useState } from 'react'

import rewardsCoverImg from '@legends/common/assets/images/rewards-cover-image.png'
import HourGlassIcon from '@legends/common/assets/svg/HourGlassIcon'
import LockIcon from '@legends/common/assets/svg/LockIcon'
import useAccountContext from '@legends/hooks/useAccountContext'
import useLeaderboardContext from '@legends/hooks/useLeaderboardContext'
import useLegendsContext from '@legends/hooks/useLegendsContext'
import usePortfolioControllerState from '@legends/hooks/usePortfolioControllerState/usePortfolioControllerState'
import ClaimRewardsModal from '@legends/modules/legends/components/ClaimRewardsModal'
import { CARD_PREDEFINED_ID } from '@legends/modules/legends/constants'
import { isMatchingPredefinedId } from '@legends/modules/legends/utils'

import styles from './RewardsBadge.module.scss'

const RewardsBadge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { connectedAccount } = useAccountContext()

  const { legends, isLoading } = useLegendsContext()
  const claimWalletCard = legends?.find((card) =>
    isMatchingPredefinedId(card.action, CARD_PREDEFINED_ID.claimRewards)
  )
  const { season1LeaderboardData, isLeaderboardLoading } = useLeaderboardContext()

  const {
    accountPortfolio,
    claimableRewardsError,
    isLoadingClaimableRewards,
    rewardsProjectionData
  } = usePortfolioControllerState()
  const openClaimModal = () => setIsOpen(true)
  const closeClaimModal = () => setIsOpen(false)

  const isRewardsLoading =
    isLoadingClaimableRewards ||
    isLoading ||
    isLeaderboardLoading ||
    !season1LeaderboardData ||
    !accountPortfolio ||
    !accountPortfolio?.isReady

  const { amountFormatted } = accountPortfolio || {}
  const isNotAvailableForRewards =
    ((accountPortfolio || accountPortfolio?.isReady) &&
      amountFormatted &&
      Number((amountFormatted ?? '0').replace(/[^0-9.-]+/g, '')) <
        (rewardsProjectionData?.minBalance || 0)) ||
    (season1LeaderboardData?.currentUser?.level ?? 0) <= 2

  const rewardsDisabledState =
    !claimWalletCard ||
    (claimWalletCard && !claimWalletCard.meta?.availableToClaim) ||
    (claimWalletCard &&
      claimWalletCard.meta &&
      Number(claimWalletCard?.meta?.availableToClaim) === 0)

  const shouldShowIcon = rewardsDisabledState || isRewardsLoading || claimableRewardsError
  const hasNoRewardsAvailable =
    claimWalletCard?.meta?.availableToClaim !== undefined &&
    Number(claimWalletCard?.meta?.availableToClaim) === 0
  const isEligible = !isNotAvailableForRewards
  const shouldShowHourglass =
    !isRewardsLoading && isEligible && (!claimWalletCard || hasNoRewardsAvailable)

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const xSign = mouseX > centerX ? 1 : -1
    const ySign = mouseY > centerY ? 1 : -1
    const rotateX = (Math.abs(centerX - mouseX) / centerX) * 10 * xSign
    const rotateY = (Math.abs(centerY - mouseY) / centerY) * 8 * ySign
    const inverseX = 100 - (mouseX / rect.width) * 100
    const inverseY = 100 - (mouseY / rect.height) * 100

    card.style.setProperty('--pointer-x', `${inverseX}%`)
    card.style.setProperty('--pointer-y', `${inverseY}%`)
    card.style.setProperty('--rotate-x', `${rotateX}deg`)
    card.style.setProperty('--rotate-y', `${rotateY}deg`)
    card.style.setProperty('--scale', '1.05')
    card.style.setProperty('--perspective', '1000px')
  }

  const resetRotation = () => {
    const card = cardRef.current
    if (!card) return
    card.style.setProperty('--rotate-x', '0deg')
    card.style.setProperty('--rotate-y', '0deg')
    card.style.setProperty('--pointer-x', '50%')
    card.style.setProperty('--pointer-y', '50%')
    card.style.setProperty('--scale', '1')
    card.style.setProperty('--perspective', '0px')
  }

  if (!connectedAccount) return null

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
        className={`${styles.rewardsBadgeWrapper} ${
          !rewardsDisabledState && claimWalletCard?.meta?.availableToClaim ? styles.active : ''
        }`}
        onMouseMove={handleMouseMove}
        onMouseLeave={resetRotation}
        onClick={() =>
          !rewardsDisabledState && claimWalletCard?.meta?.availableToClaim && openClaimModal()
        }
        onKeyDown={(e) => e.key === 'Enter' && openClaimModal()}
        role="button"
        tabIndex={0}
        aria-label="Open rewards claim modal"
      >
        <div className={styles.rewardsBadge}>
          <div className={styles.rewardsCoverImgWrapper}>
            <img
              src={rewardsCoverImg}
              className={`${styles.rewardsCoverImg} ${
                shouldShowIcon && styles.rewardsCoverImgDisabled
              }`}
              alt="rewards-cover"
            />
            {shouldShowIcon &&
              (shouldShowHourglass ? (
                <HourGlassIcon className={styles.lockIcon} width={29} height={37} />
              ) : (
                <LockIcon className={styles.lockIcon} width={29} height={37} />
              ))}
          </div>
          <div className={styles.rewardsInfo}>
            {(() => {
              // Loading state
              if (isRewardsLoading) {
                return <p>Loading rewards...</p>
              }

              // Error state
              if (claimableRewardsError) {
                return <p>Error loading rewards</p>
              }

              // Extract level and balance eligibility
              const userLevel = season1LeaderboardData?.currentUser?.level ?? 0
              const hasMinBalance =
                amountFormatted &&
                Number((amountFormatted ?? '0').replace(/[^0-9.-]+/g, '')) >=
                  (rewardsProjectionData?.minBalance || 0)
              const hasMinLevel = userLevel > 2

              // Lvl reached, Usd < 500
              if (hasMinLevel && !hasMinBalance) {
                return (
                  <p className={styles.rewardsTitle}>
                    Keep your account balance over ${rewardsProjectionData?.minBalance} to
                    accumulate rewards.
                  </p>
                )
              }

              // Lvl not reached, Usd > 500
              if (!hasMinLevel && hasMinBalance) {
                return (
                  <p className={styles.rewardsTitle}>
                    Reach level {rewardsProjectionData?.minLvl} to start accumulating rewards.
                  </p>
                )
              }

              // Lvl not reached, Usd < 500
              if (!hasMinLevel && !hasMinBalance) {
                return (
                  <p className={styles.rewardsTitle}>
                    Keep your account balance over ${rewardsProjectionData?.minBalance} and reach
                    level {rewardsProjectionData?.minLvl} to start accumulating rewards.
                  </p>
                )
              }

              // Lvl reached, Usd > 500
              if (hasMinLevel && hasMinBalance) {
                // If eligible but no rewards
                if (!claimWalletCard || hasNoRewardsAvailable) {
                  return (
                    <p className={styles.rewardsTitle}>
                      You are currently accumulating rewards for this season
                    </p>
                  )
                }
                // Active state with rewards
                return (
                  <>
                    <p className={styles.rewardsTitle}>$WALLET Rewards</p>
                    <p className={styles.rewardsAmount}>
                      {claimWalletCard?.meta?.availableToClaim
                        ? Math.floor(Number(claimWalletCard?.meta?.availableToClaim))
                            .toLocaleString('en-US', { useGrouping: true })
                            .replace(/,/g, ' ')
                        : '0'}
                    </p>
                  </>
                )
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RewardsBadge

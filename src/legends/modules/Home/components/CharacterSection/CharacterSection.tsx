import React, { useState } from 'react'

import { STK_WALLET } from '@ambire-common/consts/addresses'
import { getTokenBalanceInUSD } from '@ambire-common/libs/portfolio/helpers'
import { calculateRewardsForSeason } from '@ambire-common/utils/rewards'
import EqualIcon from '@common/assets/svg/EqualIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import MultiplicationIcon from '@common/assets/svg/MultiplicationIcon'
import StkWalletIcon from '@common/assets/svg/StkWalletIcon'
import Tooltip from '@common/components/Tooltip'
import LockIcon from '@legends/common/assets/svg/LockIcon'
import UnionIcon from '@legends/common/assets/svg/UnionIcon'
import AccountInfo from '@legends/components/AccountInfo'
import Alert from '@legends/components/Alert'
import OverachieverBanner from '@legends/components/OverachieverBanner'
import Stacked from '@legends/components/Stacked'
import { LEGENDS_SUPPORTED_NETWORKS_BY_CHAIN_ID } from '@legends/constants/networks'
import useCharacterContext from '@legends/hooks/useCharacterContext'
import useLeaderboardContext from '@legends/hooks/useLeaderboardContext'
import useLegendsContext from '@legends/hooks/useLegendsContext'
import usePortfolioControllerState from '@legends/hooks/usePortfolioControllerState/usePortfolioControllerState'
import CharacterSelect from '@legends/modules/character/screens/CharacterSelect'

import styles from './CharacterSection.module.scss'
import startsBackground from './starsBackground.png'
import substractGradientBackground from './substract-gradient.png'
import substractBackground from './substract.png'
import unknownCharacterImg from './unknown-character.png'

const THRESHOLD_AMOUNT_TO_HIDE_BALANCE_DECIMALS = 500

const CharacterSection = () => {
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
  const { character, isCharacterNotMinted } = useCharacterContext()

  const {
    accountPortfolio,
    claimableRewardsError,
    isLoadingClaimableRewards,
    rewardsProjectionData
  } = usePortfolioControllerState()

  const { legends, isLoading } = useLegendsContext()

  const { season1LeaderboardData, isLeaderboardLoading } = useLeaderboardContext()

  const isRewardsLoading =
    isLoadingClaimableRewards ||
    isLoading ||
    isLeaderboardLoading ||
    !season1LeaderboardData ||
    !accountPortfolio ||
    !accountPortfolio?.isReady

  const { amountFormatted, amount } = accountPortfolio || {}
  // Helper to format balance with/without decimals
  const formatBalance = (value: string | number | undefined) => {
    const num = Number((value ?? '0').toString().replace(/[^0-9.-]+/g, ''))
    if (num >= THRESHOLD_AMOUNT_TO_HIDE_BALANCE_DECIMALS) {
      return num.toLocaleString(undefined, {
        maximumFractionDigits: 0
      })
    }
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
  const isNotAvailableForRewards =
    ((accountPortfolio || accountPortfolio?.isReady) &&
      amountFormatted &&
      Number((amountFormatted ?? '0').replace(/[^0-9.-]+/g, '')) < 500) ||
    (season1LeaderboardData?.currentUser?.level ?? 0) <= 2

  const shouldShowIcon = !!claimableRewardsError || isNotAvailableForRewards

  const formatXp = (xp: number) => {
    return xp && xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }
  const initial7702Xp = legends.find((card) => card.id === 'eip7702')?.meta?.initial7702Xp || 0

  if (!character)
    return (
      <Alert
        className={styles.error}
        type="error"
        title="Failed to load character"
        message="Please try again later or contact support if the issue persists."
      />
    )

  const redirectToCharacterSelect = () => {
    setIsClaimModalOpen(true)
  }

  const currentLevel = season1LeaderboardData?.currentUser?.level ?? 1
  const xpForNextLevel = Math.ceil(((currentLevel + 1) * 4.5) ** 2)
  const startXpForCurrentLevel = Math.ceil((currentLevel * 4.5) ** 2)

  // Helper: get XP for not minted state (if needed)
  const characterXp = (character?.xp ?? 0) + initial7702Xp

  const currentTotalBalanceOnSupportedChains = amount || undefined

  const parsedSnapshotsBalance = rewardsProjectionData?.currentSeasonSnapshots.map(
    (snapshot: { week: number; balance: number }) => snapshot.balance
  )

  const projectedAmount =
    rewardsProjectionData &&
    calculateRewardsForSeason(
      rewardsProjectionData?.userLevel,
      parsedSnapshotsBalance,
      currentTotalBalanceOnSupportedChains ?? 0,
      rewardsProjectionData?.numberOfWeeksSinceStartOfSeason,
      rewardsProjectionData?.totalWeightNonUser,
      rewardsProjectionData?.walletPrice,
      rewardsProjectionData?.totalRewardsPool,
      rewardsProjectionData?.minLvl,
      rewardsProjectionData?.minBalance
    )

  const projectedAmountFormatted =
    projectedAmount && Math.round(projectedAmount.walletRewards * 1e18)
  const balanceInUsd = getTokenBalanceInUSD({
    chainId: BigInt(1),
    amount: BigInt(projectedAmountFormatted || 1),
    latestAmount: BigInt(projectedAmountFormatted || 1),
    pendingAmount: BigInt(projectedAmountFormatted || 1),
    address: STK_WALLET,
    symbol: 'stkWALLET',
    name: 'Staked $WALLET',
    decimals: 18,
    priceIn: [{ baseCurrency: 'usd', price: rewardsProjectionData?.walletPrice }],
    flags: {
      onGasTank: false,
      rewardsType: 'wallet-projected-rewards' as const,
      canTopUpGasTank: false,
      isFeeToken: false
    }
  })

  return (
    <>
      {isClaimModalOpen && <CharacterSelect onClose={() => setIsClaimModalOpen(false)} />}

      <div className={styles.overachieverWrapper}>
        <OverachieverBanner wrapperClassName={styles.overachieverBanner} />
      </div>

      <section
        className={`${styles.wrapper}${
          isCharacterNotMinted ? ` ${styles.unknownCharacterWrapper}` : ''
        }`}
      >
        {!isCharacterNotMinted && (
          <>
            <div className={styles.characterWrapper}>
              <div
                className={styles.substractBackground}
                style={{ backgroundImage: `url(${substractBackground})` }}
              />
              <MultiplicationIcon className={styles.multiplicationIcon} />
              <div className={styles.character}>
                <div className={styles.currentSeasonBadge}>
                  {' '}
                  <UnionIcon /> Season 1
                </div>
                <div className={styles.characterRelativeWrapper}>
                  {isCharacterNotMinted && (
                    <div className={styles.claimRewardsBubble}>
                      <p className={styles.claimRewardsBubbleText}>
                        {characterXp > 0
                          ? 'Claim your rewards & mint a cool NFT!'
                          : 'Mint a cool NFT!'}
                      </p>
                    </div>
                  )}
                  <div className={styles.characterNameWrapper}>
                    <p className={styles.characterLevel}>
                      Level
                      <p className={styles.characterLevelText}>{character.level}</p>
                    </p>
                  </div>
                  <img
                    className={styles.characterImage}
                    src={isCharacterNotMinted ? unknownCharacterImg : character?.image}
                    alt={isCharacterNotMinted ? 'unknown' : character?.characterName}
                  />
                  <div className={styles.characterPodium} />
                </div>
              </div>
              <div className={styles.levelWrapper}>
                <div className={`${styles.levelInfo} ${styles.levelInfoTop}`}>
                  <span className={styles.startXp}>XP</span>
                </div>
                <div className={styles.levelProgress}>
                  <div className={styles.levelProgressBarWrapper}>
                    <span className={styles.level}>{formatXp(startXpForCurrentLevel)}</span>
                    <span className={styles.level}>{formatXp(xpForNextLevel)}</span>
                  </div>
                  <div
                    className={styles.levelProgressBar}
                    style={{
                      width: `${(
                        (((season1LeaderboardData?.currentUser?.xp ?? startXpForCurrentLevel) -
                          startXpForCurrentLevel) /
                          (xpForNextLevel - startXpForCurrentLevel)) *
                        100
                      ).toFixed(2)}%`
                    }}
                  />
                </div>
              </div>
            </div>
            <div className={styles.characterStatsWrapper}>
              <div
                className={styles.substractBackground}
                style={{
                  backgroundImage: `url(${substractGradientBackground})`
                }}
              />
              <EqualIcon className={styles.equalIcon} />
              <div className={styles.characterStats}>
                <div className={styles.infoWrapper}>
                  Wallet Balance
                  <InfoIcon
                    width={12}
                    height={12}
                    color="currentColor"
                    className={styles.infoIcon}
                    data-tooltip-id="wallet-info"
                  />
                  <Tooltip
                    style={{
                      backgroundColor: '#101114',
                      color: '#F4F4F7',
                      fontFamily: 'FunnelDisplay',
                      fontSize: 11,
                      lineHeight: '16px',
                      fontWeight: 300,
                      maxWidth: 244,
                      boxShadow: '0px 0px 12.1px 0px #191B20'
                    }}
                    place="bottom"
                    id="wallet-info"
                    content="The balance consists of discovered tokens on the following networks: Ethereum, Base, Optimism, Arbitrum, Scroll and BNB."
                  />
                </div>
                <span className={styles.balanceAmount}>
                  {accountPortfolio?.isReady ? `$${formatBalance(amountFormatted)}` : 'Loading...'}
                </span>
              </div>
              <div className={styles.logoAndBalanceWrapper}>
                <div className={styles.logoWrapper}>
                  <Stacked
                    chains={LEGENDS_SUPPORTED_NETWORKS_BY_CHAIN_ID.map(
                      (n) => n.toString() as Networks
                    )}
                  />
                </div>
              </div>
            </div>
            <div className={styles.rewardsProjectionWrapper}>
              <div
                className={styles.starsBackground}
                style={{ backgroundImage: `url(${startsBackground})` }}
              />

              {shouldShowIcon && <LockIcon className={styles.lockIcon} width={29} height={37} />}

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

                const hasMinBalance = [...(parsedSnapshotsBalance || []), amount || 0].some(
                  (x) => x > rewardsProjectionData?.minBalance
                )
                const hasMinLevel = userLevel >= rewardsProjectionData?.minLvl

                // Lvl reached, Usd < 500
                if (hasMinLevel && !hasMinBalance) {
                  return (
                    <p className={styles.rewardsTitle}>
                      Keep your account balance over $500 to accumulate rewards.
                    </p>
                  )
                }

                // Lvl not reached, Usd > 500
                if (!hasMinLevel && hasMinBalance) {
                  return (
                    <p className={styles.rewardsTitle}>
                      Reach level 3 to start accumulating rewards.
                    </p>
                  )
                }

                // Lvl not reached, Usd < 500
                if (!hasMinLevel && !hasMinBalance) {
                  return (
                    <p className={styles.rewardsTitle}>
                      Keep your account balance over $500 and reach level 3 to start accumulating
                      rewards.
                    </p>
                  )
                }

                // Lvl reached, Usd > 500
                if (hasMinLevel && hasMinBalance) {
                  // Active state with rewards
                  return (
                    <>
                      <div className={styles.rewardsProjectionTitleWrapper}>
                        <p className={styles.rewardsProjectionTitle}>Rewards Projection </p>{' '}
                        <InfoIcon
                          width={12}
                          height={12}
                          color="currentColor"
                          className={styles.infoIcon}
                          data-tooltip-id="projected-rewards-info"
                        />
                        <Tooltip
                          style={{
                            backgroundColor: '#101114',
                            color: '#F4F4F7',
                            fontFamily: 'FunnelDisplay',
                            fontSize: 11,
                            lineHeight: '16px',
                            fontWeight: 300,
                            maxWidth: 244,
                            boxShadow: '0px 0px 12.1px 0px #191B20'
                          }}
                          place="bottom"
                          id="projected-rewards-info"
                          content="Projected rewards based on season weekly balance snapshot. End results might vary. This number is only an estimate — it will fluctuate as the season progresses, new users join, and balances shift."
                        />
                      </div>
                      <div className={styles.rewardsProjectionStats}>
                        <p className={styles.projectionStatLabel}>
                          <StkWalletIcon width={34} height={34} />
                          $stkWALLET
                        </p>
                        <p className={styles.projectionStatValue}>
                          {projectedAmount?.walletRewards
                            ? Number(projectedAmount.walletRewards) >=
                              THRESHOLD_AMOUNT_TO_HIDE_BALANCE_DECIMALS
                              ? Number(projectedAmount.walletRewards).toLocaleString(undefined, {
                                  maximumFractionDigits: 0
                                })
                              : Number(projectedAmount.walletRewards).toLocaleString(undefined, {
                                  minimumFractionDigits: 3,
                                  maximumFractionDigits: 3
                                })
                            : '0.000'}
                        </p>
                        <p className={styles.projectionStatPriceValue}>
                          {balanceInUsd
                            ? `$${
                                Number(balanceInUsd) >= THRESHOLD_AMOUNT_TO_HIDE_BALANCE_DECIMALS
                                  ? Number(balanceInUsd).toLocaleString(undefined, {
                                      maximumFractionDigits: 0
                                    })
                                  : Number(balanceInUsd).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })
                              }`
                            : '$0.00'}
                        </p>
                      </div>

                      <div className={styles.apyWrapper}>
                        <div className={styles.apyTitleWrapper}>
                          <p className={styles.rewardsProjectionTitle}>APY</p>{' '}
                          <InfoIcon
                            width={12}
                            height={12}
                            color="currentColor"
                            className={styles.infoIcon}
                            data-tooltip-id="apy-info"
                          />
                          <Tooltip
                            style={{
                              backgroundColor: '#101114',
                              color: '#F4F4F7',
                              fontFamily: 'FunnelDisplay',
                              fontSize: 11,
                              lineHeight: '16px',
                              fontWeight: 300,
                              maxWidth: 244,
                              boxShadow: '0px 0px 12.1px 0px #191B20'
                            }}
                            place="bottom"
                            id="apy-info"
                            content="Annual Percentage Yield. This percentage reflects moving average of APR (Annual Percentage Rate) for $stkWALLET rewards based on your portfolio balance and level. This percentage does not guarantee future performance and is subject to change."
                          />
                        </div>
                        <p className={styles.apyValue}>{projectedAmount?.apy.toFixed(2)}%</p>
                      </div>
                    </>
                  )
                }
              })()}
            </div>{' '}
          </>
        )}

        {isCharacterNotMinted && (
          <div className={styles.unknownCharacterContentWrapper}>
            <div className={styles.unknownCharacterContent}>
              <div className={styles.currentSeasonBadge}>
                {' '}
                <UnionIcon /> Season 1
              </div>
              <AccountInfo
                removeAvatarAndLevel
                wrapperClassName={styles.accountInfo}
                addressClassName={styles.accountInfoAddress}
              />
              <div className={styles.unknownCharacterLevelInfoWrapper}>
                {characterXp > 0 ? (
                  <p className={styles.claimableXpText}>
                    You have{' '}
                    <span className={styles.claimableBalance}>
                      {characterXp.toLocaleString()} XP
                    </span>{' '}
                    available to claim
                  </p>
                ) : (
                  <p className={styles.claimableXpText}>Join Rewards to start accumulating XP</p>
                )}

                <button
                  type="button"
                  className={styles.claimXpButton}
                  onClick={redirectToCharacterSelect}
                >
                  {characterXp > 0 ? 'Claim' : 'Join'}
                </button>
              </div>
            </div>

            <div className={styles.character}>
              <div className={styles.characterRelativeWrapper}>
                {isCharacterNotMinted && (
                  <div className={styles.claimRewardsBubble}>
                    <p className={styles.claimRewardsBubbleText}>
                      {characterXp > 0
                        ? 'Claim your rewards & mint a cool NFT!'
                        : 'Mint a cool NFT!'}
                    </p>
                  </div>
                )}
                <img
                  className={styles.characterImage}
                  src={isCharacterNotMinted ? unknownCharacterImg : character?.image}
                  alt={isCharacterNotMinted ? 'unknown' : character?.characterName}
                />
                <div className={styles.characterPodium} />
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  )
}

export default CharacterSection

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AmbireLogo from '@common/assets/svg/AmbireLogo/AmbireLogo'
import InfoIcon from '@common/assets/svg/InfoIcon'
import StarsIcon from '@common/assets/svg/StarsIcon'
import Tooltip from '@common/components/Tooltip'
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import UnionIcon from '@legends/common/assets/svg/UnionIcon'
import AccountInfo from '@legends/components/AccountInfo'
import Alert from '@legends/components/Alert'
import OverachieverBanner from '@legends/components/OverachieverBanner'
import RewardsBadge from '@legends/components/RewardsBadge'
import Stacked from '@legends/components/Stacked'
import { LEGENDS_SUPPORTED_NETWORKS_BY_CHAIN_ID } from '@legends/constants/networks'
import useCharacterContext from '@legends/hooks/useCharacterContext'
import useLeaderboardContext from '@legends/hooks/useLeaderboardContext'
import useLegendsContext from '@legends/hooks/useLegendsContext'
import usePortfolioControllerState from '@legends/hooks/usePortfolioControllerState/usePortfolioControllerState'
import CharacterSelect from '@legends/modules/character/screens/CharacterSelect'
import { Networks } from '@legends/modules/legends/types'
import { LEGENDS_ROUTES } from '@legends/modules/router/constants/routes'

import styles from './CharacterSection.module.scss'
import startsBackground from './starsBackground.png'
import unknownCharacterImg from './unknown-character.png'

const CharacterSection = () => {
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
  const { character, isCharacterNotMinted } = useCharacterContext()

  const navigate = useNavigate()
  const { legends } = useLegendsContext()
  const { accountPortfolio } = usePortfolioControllerState()
  const { season1LeaderboardData } = useLeaderboardContext()
  const { isReady, amountFormatted } = accountPortfolio || {}
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
    // navigate(LEGENDS_ROUTES.characterSelect)
    setIsClaimModalOpen(true)
  }

  const currentLevel = season1LeaderboardData?.currentUser?.level ?? 1
  const xpForNextLevel = Math.ceil(((currentLevel + 1) * 4.5) ** 2)
  const startXpForCurrentLevel = Math.ceil((currentLevel * 4.5) ** 2)

  // Helper: get XP for not minted state (if needed)
  const characterXp = (character?.xp ?? 0) + initial7702Xp

  return (
    <>
      {isClaimModalOpen && <CharacterSelect onClose={() => setIsClaimModalOpen(false)} />}
      <div className={styles.overachieverWrapper}>
        <OverachieverBanner wrapperClassName={styles.overachieverBanner} />
      </div>
      {!isCharacterNotMinted && <RewardsBadge />}
      <section
        className={`${styles.wrapper}${
          isCharacterNotMinted ? ` ${styles.unknownCharacterWrapper}` : ''
        }`}
      >
        {!isCharacterNotMinted && (
          <>
            <div className={styles.accountBaseInfoWrapper}>
              <div className={styles.accountInfoWrapper}>
                Account
                <AccountInfo
                  removeAvatarAndLevel
                  wrapperClassName={styles.accountInfo}
                  addressClassName={styles.accountInfoAddress}
                  displayTooltip
                />
              </div>
              <div className={styles.walletBalanceWrapper}>
                <div>
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
                    {isReady ? amountFormatted : 'Loading...'}
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
            </div>
            <div className={styles.characterWrapper}>
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
                    <p className={styles.characterName}>{character.characterName}</p>
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

              <div className={styles.characterStatsWrapper}>
                <div className={styles.accruidedXpWrapper}>
                  <span className={styles.accruedXpLabel}> Accrued XP</span>
                  <InfoIcon
                    width={12}
                    height={12}
                    color="currentColor"
                    className={styles.infoIcon}
                    data-tooltip-id="xp-info"
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
                    id="xp-info"
                    content="XP is earned by completing activities with your connected wallet. The more XP you earn, the higher your level and rank on the leaderboard."
                  />
                </div>
                <div className={styles.levelWrapper}>
                  <div className={`${styles.levelInfo} ${styles.levelInfoTop}`}>
                    <span className={styles.startXp}>Lvl {currentLevel}</span>
                    <span className={styles.endXp}>Lvl {currentLevel + 1}</span>
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

                  <div className={styles.xp}>
                    <span className={styles.xpLabel}>{formatXp(characterXp)} </span>XP
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.leaderboardWrapper}>
                  <div className={styles.leaderboardInfoWrapper}>
                    Leaderboard
                    <InfoIcon
                      width={12}
                      height={12}
                      color="currentColor"
                      className={styles.infoIcon}
                      data-tooltip-id="leaderboard-info"
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
                      id="leaderboard-info"
                      content="This is how you rank against everyone else participating in Ambire Rewards based on your collected XP."
                    />
                  </div>

                  <span className={styles.leaderboardRank}>
                    <FontAwesomeIcon icon={faTrophy} className={styles.trophyIcon} />
                    {season1LeaderboardData?.currentUser?.rank
                      ? season1LeaderboardData?.currentUser?.rank
                      : 'Loading...'}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.rewardsProjectionWrapper}>
              <div
                className={styles.starsBackground}
                style={{ backgroundImage: `url(${startsBackground})` }}
              />
              <StarsIcon width={33} height={38} />
              <div className={styles.rewardsProjectionTitleWrapper}>
                <p className={styles.rewardsProjectionTitle}>Rewards Projection </p>{' '}
                <InfoIcon
                  width={12}
                  height={12}
                  color="currentColor"
                  className={styles.infoIcon}
                  data-tooltip-id="leaderboard-info"
                />
              </div>
              <div className={styles.rewardsProjectionStats}>
                <p className={styles.projectionStatLabel}>
                  {' '}
                  <div className={styles.ambireLogoWrapper}>
                    <AmbireLogo width={8} height={14} />
                  </div>
                  $wallet
                </p>
                <p className={styles.projectionStatValue}>17,345</p>
                <p className={styles.projectionStatPriceValue}>$2,123</p>
              </div>
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

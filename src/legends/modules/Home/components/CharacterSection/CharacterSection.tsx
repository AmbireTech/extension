import React from 'react'

import InfoIcon from '@common/assets/svg/InfoIcon'
import Tooltip from '@common/components/Tooltip'
import UnionIcon from '@legends/common/assets/svg/UnionIcon'
import AccountInfo from '@legends/components/AccountInfo'
import Alert from '@legends/components/Alert'
import OverachieverBanner from '@legends/components/OverachieverBanner'
import RewardsBadge from '@legends/components/RewardsBadge'
import Stacked from '@legends/components/Stacked'
import { LEGENDS_SUPPORTED_NETWORKS_BY_CHAIN_ID } from '@legends/constants/networks'
import useCharacterContext from '@legends/hooks/useCharacterContext'
import useLeaderboardContext from '@legends/hooks/useLeaderboardContext'
import usePortfolioControllerState from '@legends/hooks/usePortfolioControllerState/usePortfolioControllerState'
import { Networks } from '@legends/modules/legends/types'

import styles from './CharacterSection.module.scss'

const CharacterSection = () => {
  const { character } = useCharacterContext()

  const { accountPortfolio } = usePortfolioControllerState()
  const { season1LeaderboardData } = useLeaderboardContext()
  const { isReady, amountFormatted } = accountPortfolio || {}
  const formatXp = (xp: number) => {
    return xp && xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  if (!character)
    return (
      <Alert
        className={styles.error}
        type="error"
        title="Failed to load character"
        message="Please try again later or contact support if the issue persists."
      />
    )

  const currentLevel = season1LeaderboardData?.currentUser?.level ?? 1
  const xpForNextLevel = Math.ceil(((currentLevel + 1) * 4.5) ** 2)
  const startXpForCurrentLevel = Math.ceil((currentLevel * 4.5) ** 2)

  return (
    <>
      <div className={styles.overachieverWrapper}>
        <OverachieverBanner wrapperClassName={styles.overachieverBanner} />
      </div>
      <RewardsBadge />
      <section className={`${styles.wrapper}`}>
        <div className={styles.characterInfo}>
           <div className={styles.currentSeasonBadge}>
              {' '}
              <UnionIcon /> Season 1
            </div>
          <AccountInfo
            removeAvatarAndLevel
            wrapperClassName={styles.accountInfo}
            addressClassName={styles.accountInfoAddress}
            displayTooltip
          />
          <div className={styles.characterLevelInfoWrapper}>
           
            <div className={styles.characterItemWrapper}>
              <div className={styles.levelWrapper}>
                <div className={`${styles.levelInfo} ${styles.levelInfoTop}`}>
                  <span className={styles.startXp}>Lvl. {currentLevel}</span>
                  <span className={styles.endXp}>Lvl. {currentLevel + 1}</span>
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
                  {formatXp(season1LeaderboardData?.currentUser?.xp)} XP
                </div>
              </div>
            </div>

            <div className={styles.logoAndBalanceWrapper}>
              <div className={styles.logoWrapper}>
                <Stacked
                  chains={LEGENDS_SUPPORTED_NETWORKS_BY_CHAIN_ID.map(
                    (n) => n.toString() as Networks
                  )}
                />
              </div>
              <div className={styles.characterItemWrapper}>
                <div className={styles.characterItem}>
                  <span className={styles.item}>{isReady ? amountFormatted : 'Loading...'}</span>
                  <div className={styles.characterInfoWrapper}>
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
                </div>
              </div>
            </div>

            <div className={styles.characterItemWrapper}>
              <div className={styles.characterItem}>
                <span className={styles.item}>
                  {season1LeaderboardData?.currentUser?.rank
                    ? season1LeaderboardData?.currentUser?.rank
                    : 'Loading...'}
                </span>
                <div className={styles.characterInfoWrapper}>
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
              </div>
            </div>
          </div>
        </div>
       

        <div className={styles.character}>
          <div className={styles.characterRelativeWrapper}>
            <img
              className={styles.characterImage}
              src={character.image}
              alt={character.characterName}
            />
          </div>
        </div>
      </section>
    </>
  )
}

export default CharacterSection

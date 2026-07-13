import React from 'react'

import bentoStakingIllustration from '../Home/assets/bento-staking-illustration.png'

import styles from './WalletBento.module.scss'

/** Two info cards from $WALLET Figma ($WALLET frame, staking + page overview). */
const WalletBento: React.FC = () => {
  return (
    <section className={styles.section} aria-label="$WALLET information">
      <div className={styles.row}>
        <div className={`${styles.card} ${styles.staking}`}>
          <img src={bentoStakingIllustration} alt="" className={styles.illustration} />
          <p className={styles.stakingText}>
            <span className={styles.lead}>
              Earn $WALLET rewards by staking your $WALLET tokens.
            </span>{' '}
            <span className={styles.body}>
              There is no Ambire Rewards season running currently, but we are planning to
              reintroduce the incentive soon. In the meantime, put your $WALLET tokens to work via
              Ambire Staking.
            </span>
          </p>
        </div>
        <div className={`${styles.card} ${styles.overview}`}>
          <p className={styles.overviewText}>
            <span className={styles.lead}>On this page you can</span>{' '}
            <span className={styles.body}>
              learn more about the $WALLET token, stake $WALLET or check the leaderboard for all
              past Rewards seasons.
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}

export default WalletBento

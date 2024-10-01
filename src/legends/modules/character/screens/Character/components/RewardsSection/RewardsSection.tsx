import React from 'react'

import usePortfolioControllerState from '@legends/hooks/usePortfolioControllerState/usePortfolioControllerState'

import SectionHeading from '../SectionHeading'
import styles from './RewardsSection.module.scss'

const MINIMUM_BALANCE_REQUIRED = 3000
const MINIMUM_PROGRESS_FILL_WIDTH = 10

const RewardsSection = () => {
  const { accountPortfolio } = usePortfolioControllerState()
  const { isReady, error, amountFormatted, amount } = accountPortfolio || {}

  const percentageOfMinimumBalance = ((amount || 1) / MINIMUM_BALANCE_REQUIRED) * 100

  return (
    <section className={styles.wrapper}>
      <SectionHeading>Rewards</SectionHeading>
      <div className={styles.items}>
        <div className={styles.item}>
          <h3 className={styles.itemTitle}>Balance required to earn rewards</h3>
          {error && <p>Error: {error}</p>}
          {isReady && amount && (
            <div className={styles.progress}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${
                    percentageOfMinimumBalance < MINIMUM_PROGRESS_FILL_WIDTH
                      ? MINIMUM_PROGRESS_FILL_WIDTH
                      : percentageOfMinimumBalance
                  }%`
                }}
              >
                <span className={styles.progressCurrent}>{amountFormatted}</span>
              </div>
              <span className={styles.progressMax}>${MINIMUM_BALANCE_REQUIRED}</span>
            </div>
          )}
          {!isReady && !error && <p>Loading...</p>}
        </div>
        <div className={styles.item}>
          <h3 className={styles.itemTitle}>Minimum potential earnings</h3>
          <div className={styles.rewardRateAndFormula}>
            <p className={styles.rewardRate}>543 stkWALLET / minute</p>
            <p className={styles.rewardFormula}>Formula: (xp / 69420)</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default RewardsSection

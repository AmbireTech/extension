import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Alert from '@legends/components/Alert'
import Page from '@legends/components/Page'
import usePortfolioControllerState from '@legends/hooks/usePortfolioControllerState/usePortfolioControllerState'

import RewardsPoolChart from './components/RewardsPoolChart'
import styles from './RewardsPool.module.scss'

const END_DATE = new Date('2026-03-15T11:59:59.999Z')

const RewardsPool = () => {
  const { t } = useTranslation()
  const { userRewardsStats } = usePortfolioControllerState()
  const [timeLeft, setTimeLeft] = useState('')
  const timerTimeout = useRef<NodeJS.Timeout | null>(null)
  const swapVolume = userRewardsStats?.swapVolume ?? null
  const poolSize = userRewardsStats?.poolSize ?? null

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date()
      const diff = END_DATE.getTime() - now.getTime()

      if (diff < 0) {
        setTimeLeft('Ended')
      } else if (diff < 1000 * 60 * 60 * 24) {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeft(`${hours}h ${minutes}min`)
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

        setTimeLeft(`${days}d ${hours}h`)
      }
    }

    updateTimeLeft()
    timerTimeout.current = setInterval(updateTimeLeft, 60 * 1000) // Update every minute

    return () => {
      if (timerTimeout.current) {
        clearInterval(timerTimeout.current)
      }
    }
  }, [])

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`
    }
    return `$${value.toFixed(0)}`
  }

  return (
    <Page>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Rewards Pool</h1>
            <p className={styles.text}>Swap & bridge more to grow the global rewards pool.</p>
          </div>
          <div className={styles.timeLeft}>
            <span className={styles.label}>Time left in season</span>
            <span className={styles.value}>{timeLeft}</span>
          </div>
        </div>
        {typeof swapVolume === 'number' && poolSize ? (
          <div className={styles.chartWrapper}>
            <div className={styles.chartData}>
              <span className={styles.label}>Current Swap&Bridge volume</span>
              <span className={styles.value}>{formatCurrency(swapVolume)}</span>
              <span className={styles.label}>Current Rewards Pool</span>
              <span className={styles.value2}>{formatCurrency(poolSize)}</span>
            </div>
            <RewardsPoolChart className={styles.chart as string} volume={swapVolume} />
          </div>
        ) : (
          <Alert
            className={styles.alert}
            title={t('Failed to load rewards pool data')}
            type="error"
          />
        )}
      </div>
    </Page>
  )
}

export default RewardsPool

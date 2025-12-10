import React, { useEffect, useRef, useState } from 'react'

import Page from '@legends/components/Page'

import RewardsPoolChart from './components/RewardsPoolChart'
import styles from './RewardsPool.module.scss'

const END_DATE = new Date('2026-03-31T23:59:59Z')

const Character = () => {
  const [timeLeft, setTimeLeft] = useState('')
  const timerTimeout = useRef<NodeJS.Timeout | null>(null)
  const SWAP_VOLUME = 4.32 * 1_000_000
  const REWARDS_POOL = 100_000

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
        <div className={styles.chartWrapper}>
          <div className={styles.chartData}>
            <span className={styles.label}>Current Swap&Bridge volume</span>
            <span className={styles.value}>{formatCurrency(SWAP_VOLUME)}</span>
            <span className={styles.label}>Current Rewards Pool</span>
            <span className={styles.value2}>{formatCurrency(REWARDS_POOL)}</span>
          </div>
          <RewardsPoolChart className={styles.chart as string} volume={SWAP_VOLUME} />
        </div>
      </div>
    </Page>
  )
}

export default Character

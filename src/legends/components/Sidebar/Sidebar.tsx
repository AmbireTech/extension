import React, { FC, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons/faChevronLeft'
import { faCircleUser } from '@fortawesome/free-solid-svg-icons/faCircleUser'
import { faFileLines } from '@fortawesome/free-solid-svg-icons/faFileLines'
import { faMedal } from '@fortawesome/free-solid-svg-icons/faMedal'
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Activity, LegendActivity } from '@legends/contexts/activityContext/types'
import useActivityContext from '@legends/hooks/useActivityContext'
import WheelComponent from '@legends/modules/legends/components/WheelComponentModal'
import { LEGENDS_ROUTES } from '@legends/modules/router/constants'

import Link from './components/Link'
import Socials from './components/Socials'
import styles from './Sidebar.module.scss'

type Props = {
  isOpen: boolean
  handleClose: () => void
}

const NAVIGATION_LINKS = [
  { to: LEGENDS_ROUTES.character, text: 'Character', icon: faCircleUser },
  { to: LEGENDS_ROUTES.legends, text: 'Legends', icon: faMedal },
  { to: LEGENDS_ROUTES.leaderboard, text: 'Leaderboard', icon: faTrophy },
  { to: '', text: 'Guide', icon: faFileLines }
]

const Sidebar: FC<Props> = ({ isOpen, handleClose }) => {
  const { pathname } = useLocation()
  const [isFortuneWheelModalOpen, setIsFortuneWheelModalOpen] = useState(false)
  const { activity, isLoading } = useActivityContext()

  const wheelSpinOfTheDay = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    if (!activity || isLoading) return false
    const transaction: Activity | undefined = activity.find(
      (txn: Activity) =>
        txn.submittedAt.startsWith(today) &&
        txn.legends.activities &&
        txn.legends.activities.some((acc: LegendActivity) =>
          acc.action.startsWith('WheelOfFortune')
        )
    )

    return !!transaction
  }, [activity, isLoading])

  const handleModal = () => {
    setIsFortuneWheelModalOpen(!isFortuneWheelModalOpen)
  }

  return (
    <div className={`${styles.wrapper} ${isOpen ? styles.open : ''}`}>
      <div className={styles.top}>
        <button type="button" onClick={handleClose} className={styles.closeButton}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <img className={styles.logo} src="/images/logo.png" alt="Ambire Legends" />
        <div className={styles.wheelOfFortuneWrapper}>
          <div className={styles.wheelOfFortune}>
            <img
              src="/images/sidebar/spin-the-wheel.png"
              alt="Daily Legend"
              className={styles.wheelImage}
            />
            <div className={styles.wheelContent}>
              <span className={styles.wheelTitle}>Daily Legend</span>
              <span className={styles.wheelText}>Available Now</span>
              <button onClick={handleModal} type="button" className={styles.wheelButton} disabled={wheelSpinOfTheDay}>
                Spin the Wheel
              </button>
            </div>
          </div>
        </div>
        <WheelComponent isOpen={isFortuneWheelModalOpen} setIsOpen={setIsFortuneWheelModalOpen} />
        <div className={styles.links}>
          {NAVIGATION_LINKS.map((link) => (
            <Link
              isActive={pathname === link.to}
              key={link.to}
              to={link.to}
              text={link.text}
              icon={link.icon}
            />
          ))}
        </div>
      </div>
      <Socials />
    </div>
  )
}

export default Sidebar

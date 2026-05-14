import React, { FC, useRef } from 'react'
import { useLocation } from 'react-router-dom'

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons/faChevronLeft'
import { faFileLines } from '@fortawesome/free-solid-svg-icons/faFileLines'
import { faPiggyBank } from '@fortawesome/free-solid-svg-icons/faPiggyBank'
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LEGENDS_ROUTES } from '@legends/modules/router/constants'

import Link from './components/Link'
import Socials from './components/Socials'
import styles from './Sidebar.module.scss'

type Props = {
  isOpen: boolean
  handleClose: () => void
}

const NAVIGATION_LINKS = [
  { to: LEGENDS_ROUTES.wallet, text: '$Wallet', icon: faPiggyBank },
  { to: LEGENDS_ROUTES.leaderboard, text: 'Rewards', icon: faTrophy },
  {
    to: 'https://help.ambire.com/en/collections/18211459-ambire-rewards',
    text: 'FAQ',
    icon: faFileLines,
    newTab: true
  }
]

const Sidebar: FC<Props> = ({ isOpen, handleClose }) => {
  const { pathname } = useLocation()
  const containerRef = useRef(null)

  return (
    <div className={`${styles.wrapper} ${isOpen ? styles.open : ''}`}>
      <div className={styles.top} ref={containerRef}>
        <button type="button" onClick={handleClose} className={styles.closeButton}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <img className={styles.logo} src="/images/logo.png" alt="Ambire Rewards" />

        <div className={styles.links}>
          {NAVIGATION_LINKS.map((link) => (
            <Link
              isActive={pathname === link.to}
              key={link.to}
              to={link.to}
              text={link.text}
              icon={link.icon}
              newTab={link.newTab}
            />
          ))}
        </div>
      </div>
      <div>
        <Socials />
      </div>
    </div>
  )
}

export default Sidebar

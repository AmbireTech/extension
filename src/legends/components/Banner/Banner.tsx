import React from 'react'

import styles from './Banner.module.scss'
import governance from './governance.png'

const Banner: React.FC = () => {
  return (
    <div className={styles.container}>
      <img className={styles.iconPlaceholder} src={governance} alt="Governance banner icon" />
      <div className={styles.textContent}>
        <div className={styles.title}>
          🗳️ Should we extend Ambire Rewards Season 1 until December 15, 2025? Vote until October
          5th.
        </div>
        <a
          href="https://snapshot.box/#/s:ambire.eth/proposal/0x95c6d26b2bbf628f62a85a27d9a9ee5b19d0ea864385d3da40aff2b97025008b"
          className={styles.readMoreLink}
          target="_blank"
          rel="noreferrer"
        >
          Read more &gt;
        </a>
      </div>
    </div>
  )
}

export default Banner

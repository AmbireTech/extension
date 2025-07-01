import React from 'react'

import styles from './Banner.module.scss'
import governance from './governance.png'

const Banner: React.FC = () => {
  return (
    <div className={styles.container}>
      <img className={styles.iconPlaceholder} src={governance} alt="Governance banner icon" />
      <div className={styles.textContent}>
        <div className={styles.title}>Vote to decide Season 1 rewards until 24.6.2025 </div>
        <a
          href="https://blog.ambire.com/rewards-distribution-season1/"
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

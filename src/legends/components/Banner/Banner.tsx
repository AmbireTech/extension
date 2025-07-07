import React from 'react'

import styles from './Banner.module.scss'
import governance from './governance.png'

const Banner: React.FC = () => {
  return (
    <div className={styles.container}>
      <img className={styles.iconPlaceholder} src={governance} alt="Governance banner icon" />
      <div className={styles.textContent}>
        <div className={styles.title}>Season 1 reward pool discussion (15M, 20M, 25M stkWALLET) until 7th July!</div>
        <a
          href="https://blog.ambire.com/p/180e766e-0faa-4b32-8461-9d2244cb91d5/"
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

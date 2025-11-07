import React from 'react'

import LockIcon from '@legends/common/assets/svg/LockIcon/LockIcon'
import styles from '@legends/components/OverachieverBanner/OverachieverBanner.module.scss'
import useAccountContext from '@legends/hooks/useAccountContext/useAccountContext'

const V1AccountBanner: React.FC = () => {
  const { v1Account } = useAccountContext()
  if (!v1Account) return null
  return (
    <div className={styles.overachieverBanner}>
      <LockIcon className={styles.lockIcon} width={29} height={37} />
      <p className={styles.overachieverText}>
        Switch to a new account to unlock Rewards quests. Ambire legacy accounts not supported.
      </p>
    </div>
  )
}

export default V1AccountBanner

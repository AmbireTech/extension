import React from 'react'

import LockIcon from '@legends/common/assets/svg/LockIcon/LockIcon'
import Modal from '@legends/components/Modal'
import styles from '@legends/components/V1AccountBannerModal/V1AccountBannerModal.module.scss'

interface V1AccountBannerModalProps {
  isOpen: boolean
  onClose: () => void
}

const V1AccountBannerModal: React.FC<V1AccountBannerModalProps> = ({ isOpen, onClose }) => (
  <Modal className={styles.modal} isOpen={isOpen} handleClose={onClose}>
    <LockIcon className={styles.lockIcon} width={29} height={37} />
    <div>
      <p className={styles.text}>
        Switch to a new account to unlock Rewards quests. Ambire legacy accounts not supported.
      </p>
    </div>
  </Modal>
)

export default V1AccountBannerModal

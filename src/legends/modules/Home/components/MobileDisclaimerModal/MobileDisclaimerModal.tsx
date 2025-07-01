import React, { useEffect, useState } from 'react'

import styles from './MobileDisclaimerModal.module.scss'

interface MobileDisclaimerModalProps {
  shouldClose?: boolean
  modalOpened?: boolean
  closeModal?: () => void
}

const MobileDisclaimerModal = ({
  shouldClose = false,
  modalOpened,
  closeModal
}: MobileDisclaimerModalProps) => {
  const [isAccepted, setIsAccepted] = useState(() => {
    const isAcceptedBefore = localStorage.getItem('mobileDisclaimerAccepted')
    return isAcceptedBefore === 'true'
  })

  const [isOpen, setIsOpen] = useState(modalOpened === true)

  useEffect(() => {
    // Always update isOpen when modalOpened prop changes
    if (modalOpened !== undefined) {
      setIsOpen(modalOpened)
    }
  }, [modalOpened])

  const handleAccept = () => {
    if (shouldClose) {
      setIsOpen(false)
      closeModal && closeModal()
      return
    }
    setIsAccepted(true)
    localStorage.setItem('mobileDisclaimerAccepted', 'true')
    setIsOpen(false)
  }

  const shouldShow = isOpen || !isAccepted

  return (
    <div className={`${styles.backdrop} ${shouldShow ? '' : styles.hidden}`}>
      <div className={styles.modal}>
        <p className={styles.text}>
          The Ambire Rewards app is <strong>desktop-only</strong>. To connect, install the Ambire
          Wallet extension on a Chromium-based desktop browser like Chrome, Edge, Brave, Opera, or
          Arc.
        </p>
        <button type="button" className={styles.button} onClick={handleAccept}>
          Okay
        </button>
      </div>
    </div>
  )
}

export default MobileDisclaimerModal

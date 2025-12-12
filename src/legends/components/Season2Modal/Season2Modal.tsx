import React, { useState } from 'react'

import Modal from '../Modal'
import background from './media/season2-background.png'
import styles from './Season2Modal.module.scss'

const STORAGE_KEY = 'season2_modal_shown'

const Season2Modal = () => {
  const [isOpen, setIsOpen] = useState(() => {
    const hasBeenShown = localStorage.getItem(STORAGE_KEY)

    return !hasBeenShown
  })

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsOpen(false)
  }

  return (
    <Modal isOpen={isOpen} handleClose={handleClose} className={styles.wrapper}>
      <div className={styles.content} style={{ backgroundImage: `url(${background})` }}>
        <h1 className={styles.title}>Ambire Rewards Season 2 is here!</h1>
        <a href="TODO" target="_blank" rel="noreferrer" className={styles.link}>
          Read the Announcement
        </a>
      </div>
    </Modal>
  )
}

export default Season2Modal

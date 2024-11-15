import React from 'react'

import Modal from '@legends/components/Modal'
import Spinner from '@legends/components/Spinner'

import styles from './CharacterLoadingModal.module.scss'

interface CharacterLoadingModalProps {
  loadingMessage: string
  isOpen: boolean
  errorMessage: string | null
}

const MESSAGES = [
  'Initializing character setup...',
  'Connecting to the blockchain, please sign your transaction so we can proceed',
  'Securing NFT...',
  'Finalizing details...'
]
const CharacterLoadingModal: React.FC<CharacterLoadingModalProps> = ({
  loadingMessage,
  isOpen,
  errorMessage
}) => {
  return (
    <Modal isOpen={isOpen} isClosable={false} className={styles.modal}>
      <div className={styles.modalContent}>
        <Modal.Heading className={styles.modalHeading}>
          Creating Your Unique Character NFT
        </Modal.Heading>
        <Modal.Text className={styles.modalText}>
          Please keep this window open until setup completes. You’ll be redirected shortly to begin
          your adventure!
        </Modal.Text>
        {!errorMessage && <Spinner />}
        <p className={styles.message}>{loadingMessage}</p>
        <div className={styles.progressBarContainer}>
          <div
            className={styles.progress}
            style={{
              width: `${(MESSAGES.indexOf(loadingMessage) / (MESSAGES.length - 1)) * 100}%`
            }}
          />
        </div>

        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
      </div>
    </Modal>
  )
}

export default CharacterLoadingModal

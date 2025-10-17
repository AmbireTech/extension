import React from 'react'

import Modal from '@legends/components/Modal'
import Spinner from '@legends/components/Spinner'
import Stacked from '@legends/components/Stacked'
import { LEGENDS_SUPPORTED_NETWORKS_BY_CHAIN_ID } from '@legends/constants/networks'
import { Networks } from '@legends/modules/legends/types'

import styles from './CharacterLoadingModal.module.scss'

interface CharacterLoadingModalProps {
  loadingMessage: string
  isOpen: boolean
  errorMessage: string | null
  showOnMintModal: boolean
  onButtonClick: () => void
}

const MESSAGES = [
  'Initializing character setup...',
  'Please sign the pending transaction to proceed',
  'Securing NFT...',
  'Finalizing details...'
]
const CharacterLoadingModal: React.FC<CharacterLoadingModalProps> = ({
  loadingMessage,
  isOpen,
  errorMessage,
  showOnMintModal,
  onButtonClick
}) => {
  return (
    <Modal
      isOpen={isOpen}
      isClosable={false}
      className={styles.modal}
      wrapperClassName={styles.modalWrapper}
    >
      {showOnMintModal ? (
        <div>
          <p className={styles.title}>Welcome to Ambire Rewards</p>
          <p className={styles.description}>
            Remember, every transaction made with this account on our eligible networks earns you
            XP, regardless of the app you are using.
          </p>
          <div className={styles.stackedWrapper}>
            <Stacked
              chains={LEGENDS_SUPPORTED_NETWORKS_BY_CHAIN_ID.map((n) => n.toString() as Networks)}
            />{' '}
          </div>
          <button onClick={onButtonClick} type="button" className={styles.button}>
            Continue
          </button>
        </div>
      ) : (
        <div className={styles.modalContent}>
          <Modal.Heading className={styles.modalHeading}>
            Creating Your Unique Character NFT
          </Modal.Heading>
          <Modal.Text className={styles.modalText}>
            Please keep this window open until setup completes. You’ll be redirected shortly to
            begin your adventure!
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
      )}
    </Modal>
  )
}

export default CharacterLoadingModal

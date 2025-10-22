import React, { FC } from 'react'

import Modal from '@legends/components/Modal'

import styles from './SelectProviderModal.module.scss'
import { Providers, WalletType } from './types'

type Props = {
  isConnectModalOpen: boolean
  setIsConnectModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  providers: Providers
  selectProvider: (walletId: WalletType, shouldCloseModal?: boolean) => Promise<void>
}

const SelectProviderModal: FC<Props> = ({
  isConnectModalOpen,
  providers,
  setIsConnectModalOpen,
  selectProvider
}) => {
  return (
    <Modal
      isOpen={isConnectModalOpen}
      handleClose={() => setIsConnectModalOpen(false)}
      showCloseButton={false}
    >
      <Modal.Heading className={styles.title}>Connect a Wallet</Modal.Heading>
      <div className={styles.providers}>
        {Object.keys(providers).map((walletId) => {
          const walletProvider = providers[walletId as keyof Providers]

          return (
            <button
              onClick={() => selectProvider(walletId as keyof Providers, true)}
              type="button"
              key={walletId}
              className={styles.provider}
            >
              <img
                src={walletProvider.info.icon}
                alt={walletProvider.info.name}
                width={32}
                height={32}
                className={styles.providerIcon}
              />
              <span className={styles.providerName}>{walletProvider.info.name}</span>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}

export default SelectProviderModal

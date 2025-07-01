/* eslint-disable no-console */
import { BrowserProvider, Contract, formatUnits, Interface, JsonRpcProvider } from 'ethers'
import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import CloseIcon from '@legends/components/CloseIcon'
import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import { ETHEREUM_CHAIN_ID } from '@legends/constants/networks'
import useAccountContext from '@legends/hooks/useAccountContext'
import useErc5792 from '@legends/hooks/useErc5792'
import useEscModal from '@legends/hooks/useEscModal'
import useLegendsContext from '@legends/hooks/useLegendsContext'
import usePortfolioControllerState from '@legends/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useSwitchNetwork from '@legends/hooks/useSwitchNetwork'
import useToast from '@legends/hooks/useToast'
import { humanizeError } from '@legends/modules/legends/utils/errors/humanizeError'

import { CardActionCalls, CardActionPredefined, CardFromResponse } from '../../types'
import CardActionButton from '../Card/CardAction/actions/CardActionButton'
import styles from './MigrateRewardsModal.module.scss'

type Action = CardActionPredefined & {
  calls: CardActionCalls['calls']
}
interface MigrateRewardsModalProps {
  isOpen: boolean
  handleClose: () => void
  action: Action | undefined
  meta: CardFromResponse['meta'] | undefined
  card: CardFromResponse['card'] | undefined
}

const walletIface = new Interface([
  'function approve(address,uint)',
  'function balanceOf(address) view returns (uint256)'
])

const X_WALLET_TOKEN = '0x47Cd7E91C3CBaAF266369fe8518345fc4FC12935'

const MigrateRewardsModal: React.FC<MigrateRewardsModalProps> = ({
  isOpen,
  handleClose,
  action
}) => {
  const { xWalletClaimableBalance } = usePortfolioControllerState()
  const { sendCalls, getCallsStatus, chainId } = useErc5792()
  const { onLegendComplete } = useLegendsContext()

  const { addToast } = useToast()
  const { connectedAccount, v1Account } = useAccountContext()
  const switchNetwork = useSwitchNetwork()
  const disabledButton = Boolean(!connectedAccount || v1Account)

  const [walletBalance, setWalletBalance] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigning, setIsSigning] = useState(false)
  const closeModal = async () => {
    handleClose()
  }

  const getWalletBalance = useCallback(async () => {
    if (!connectedAccount) return
    const ethereumProvider = new JsonRpcProvider('https://invictus.ambire.com/ethereum')
    const walletContract = new Contract(X_WALLET_TOKEN, walletIface, ethereumProvider)
    walletContract
      .balanceOf(connectedAccount)
      .then(setWalletBalance)
      .catch((e) => {
        console.error(e)
        addToast('Failed to get $WALLET token balance', { type: 'error' })
      })
      .finally(() => setIsLoading(false))
  }, [connectedAccount, addToast])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getWalletBalance()
  }, [getWalletBalance])

  // Close Modal on ESC
  useEscModal(isOpen, closeModal)

  const onButtonClick = useCallback(async () => {
    if (!action || !action.calls) return
    await switchNetwork(ETHEREUM_CHAIN_ID)

    try {
      const provider = new BrowserProvider(window.ambire)
      const signer = await provider.getSigner()

      const formattedCalls = action.calls.map(([to, value, data]) => {
        return { to, value, data }
      })

      setIsSigning(true)

      const sendCallsIdentifier = await sendCalls(
        chainId,
        await signer.getAddress(),
        formattedCalls,
        false
      )

      const receipt = await getCallsStatus(sendCallsIdentifier)
      if (receipt.transactionHash) {
        addToast('Transaction completed successfully', { type: 'success' })
        setIsSigning(false)
        getWalletBalance()
        onLegendComplete()
        handleClose()
      }
    } catch (e: any) {
      const message = humanizeError(e, ERROR_MESSAGES.transactionProcessingFailed)
      console.error(e)
      setIsSigning(false)

      addToast(message, { type: 'error' })
    }
  }, [
    switchNetwork,
    action,
    getCallsStatus,
    onLegendComplete,
    sendCalls,
    getWalletBalance,
    chainId,
    handleClose,
    addToast
  ])

  if (!isOpen) return null

  return createPortal(
    <div className={styles.backdrop}>
      <div className={styles.wrapper}>
        <button type="button" onClick={closeModal} className={styles.closeButton}>
          <CloseIcon />
        </button>

        <div className={styles.contentWrapper}>
          <h2 className={styles.title}>Migrate xWALLET</h2>
          {walletBalance ? (
            <div className={styles.content}>
              <div>
                <p className={styles.sectionTitle}>Your xWALLET</p>
                <div className={styles.sectionContent}>
                  <p>
                    {walletBalance &&
                      formatDecimals(
                        Number(
                          parseFloat(formatUnits(walletBalance, xWalletClaimableBalance.decimals))
                        ),
                        'amount'
                      )}
                  </p>
                  <p className={styles.usdValue}>
                    {walletBalance &&
                      getAndFormatTokenDetails(
                        {
                          ...xWalletClaimableBalance,
                          amount: walletBalance,
                          flags: { rewardsType: 'wallet-rewards' }
                        },
                        [{ chainId: 1 }]
                      ).balanceUSDFormatted}{' '}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className={styles.noWalletTitle}>No xWALLET found</p>
          )}

          <CardActionButton
            onButtonClick={onButtonClick}
            buttonText={
              disabledButton
                ? 'Switch to a new account to unlock Rewards quests.'
                : 'Migrate xWALLET'
            }
            className={styles.button}
            disabled={disabledButton || isSigning || isLoading}
          />
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') as HTMLElement
  )
}

export default MigrateRewardsModal

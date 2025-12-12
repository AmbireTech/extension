/* eslint-disable no-console */
import { Contract, formatEther, formatUnits, Interface, JsonRpcProvider } from 'ethers'
import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import CloseIcon from '@legends/components/CloseIcon'
import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import { ETHEREUM_CHAIN_ID } from '@legends/constants/networks'
import useAccountContext from '@legends/hooks/useAccountContext'
import useErc5792 from '@legends/hooks/useErc5792'
import useEscModal from '@legends/hooks/useEscModal'
import useLegendsContext from '@legends/hooks/useLegendsContext'
import usePortfolioControllerState from '@legends/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useProviderContext from '@legends/hooks/useProviderContext'
import useSwitchNetwork from '@legends/hooks/useSwitchNetwork'
import useToast from '@legends/hooks/useToast'
import { humanizeError } from '@legends/modules/legends/utils/errors/humanizeError'
import { getRewardsButtonText } from '@legends/utils/getRewardsButtonText'

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

const xWalletIface = new Interface([
  'function approve(address,uint)',
  'function balanceOf(address) view returns (uint256)',
  'function lockedShares(address) view returns (uint256)'
])

const X_WALLET_TOKEN = '0x47Cd7E91C3CBaAF266369fe8518345fc4FC12935'

const MigrateRewardsModal: React.FC<MigrateRewardsModalProps> = ({
  isOpen,
  handleClose,
  action,
  meta
}) => {
  const { xWalletClaimableBalance } = usePortfolioControllerState()
  const { sendCalls, getCallsStatus, chainId } = useErc5792()
  const { onLegendComplete } = useLegendsContext()

  const { addToast } = useToast()
  const { browserProvider } = useProviderContext()
  const { connectedAccount, v1Account } = useAccountContext()
  const switchNetwork = useSwitchNetwork()
  const disabledButton = Boolean(!connectedAccount || v1Account)

  const buttonText = getRewardsButtonText({
    connectedAccount,
    v1Account: !!v1Account
  })

  const [migratableXWalletBalance, setMigratableXWalletBalance] = useState<bigint | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigning, setIsSigning] = useState(false)
  const closeModal = async () => {
    handleClose()
  }

  const getXWalletBalance = useCallback(async () => {
    if (!connectedAccount) return
    const ethereumProvider = new JsonRpcProvider('https://invictus.ambire.com/ethereum')
    const walletContract = new Contract(X_WALLET_TOKEN, xWalletIface, ethereumProvider)
    Promise.all([
      walletContract.balanceOf!(connectedAccount),
      walletContract.lockedShares!(connectedAccount)
    ])
      .then(([xWalletBalance, lockedShares]: [bigint, bigint]) =>
        setMigratableXWalletBalance(xWalletBalance - lockedShares)
      )
      .catch((e) => {
        console.error(e)
        addToast('Failed to get $WALLET token balance', { type: 'error' })
      })
      .finally(() => setIsLoading(false))
  }, [connectedAccount, addToast])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getXWalletBalance()
  }, [getXWalletBalance])

  // Close Modal on ESC
  useEscModal(isOpen, closeModal)

  const onButtonClick = useCallback(async () => {
    if (!browserProvider) return
    if (!action || !action.calls) return
    await switchNetwork(ETHEREUM_CHAIN_ID)

    try {
      const signer = await browserProvider.getSigner()

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
        getXWalletBalance()
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
    browserProvider,
    switchNetwork,
    action,
    getCallsStatus,
    onLegendComplete,
    sendCalls,
    getXWalletBalance,
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
          {migratableXWalletBalance ? (
            <div className={styles.content}>
              <div>
                <p className={styles.sectionTitle}>Your xWALLET</p>
                <div className={styles.sectionContent}>
                  <p>
                    {migratableXWalletBalance
                      ? formatDecimals(
                          Number(parseFloat(formatUnits(migratableXWalletBalance, 18))),
                          'amount'
                        )
                      : 'Loading...'}
                  </p>
                  <p className={styles.usdValue}>
                    {migratableXWalletBalance && xWalletClaimableBalance?.priceIn.length
                      ? formatDecimals(
                          xWalletClaimableBalance.priceIn![0]!.price *
                            Number(formatEther(migratableXWalletBalance)),
                          'value'
                        )
                      : 'Loading...'}{' '}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className={styles.noWalletTitle}>No xWALLET found</p>
          )}

          {meta?.hasAlreadyMigrated && (
            <div className={styles.alreadyMigratedWarning}>
              {/* TODO: UPDATE TEXT */}
              You will not receive XP from this action as you already migrated some of your $xWALLET
              tokens!
            </div>
          )}
          <CardActionButton
            onButtonClick={onButtonClick}
            buttonText={disabledButton ? buttonText : 'Migrate xWALLET'}
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

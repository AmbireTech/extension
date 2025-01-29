import { BrowserProvider } from 'ethers'
import React, { useCallback, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import CoinIcon from '@legends/common/assets/svg/CoinIcon'
import CloseIcon from '@legends/components/CloseIcon'
import MidnightTimer from '@legends/components/MidnightTimer'
import Modal from '@legends/components/Modal'
import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import useAccountContext from '@legends/hooks/useAccountContext'
import useErc5792 from '@legends/hooks/useErc5792'
import useLegendsContext from '@legends/hooks/useLegendsContext'
import useSwitchNetwork from '@legends/hooks/useSwitchNetwork'
import useToast from '@legends/hooks/useToast'
import { CARD_PREDEFINED_ID } from '@legends/modules/legends/constants'
import { checkTransactionStatus } from '@legends/modules/legends/helpers'
import { CardActionCalls, CardStatus, ChestCard } from '@legends/modules/legends/types'
import { isMatchingPredefinedId } from '@legends/modules/legends/utils'
import { humanizeLegendsBroadcastError } from '@legends/modules/legends/utils/errors/humanizeBroadcastError'

import chainImage from './assets/chain.png'
import chestImageOpened from './assets/chest-opened.png'
import chestImage from './assets/chest.png'
import starImage from './assets/star.png'
import styles from './TreasureChestComponentModal.module.scss'

interface TreasureChestComponentModalProps {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const POST_UNLOCK_STATES = ['unlocked', 'opening', 'opened', 'error']

const TreasureChestComponentModal: React.FC<TreasureChestComponentModalProps> = ({
  isOpen,
  setIsOpen
}) => {
  const { addToast } = useToast()
  const { connectedAccount } = useAccountContext()
  const [isCongratsModalOpen, setCongratsModalOpen] = useState(false)
  const [chestState, setChestState] = useState<
    'locked' | 'unlocking' | 'unlocked' | 'opening' | 'opened' | 'error'
  >('locked')
  const [isInProgress, setIsInProgress] = useState(false)
  const { sendCalls, getCallsStatus, chainId } = useErc5792()
  const chainRef = React.useRef<HTMLImageElement>(null)

  const unlockChainAnimation = useCallback(() => {
    if (chainRef.current) chainRef.current.classList.add(styles.unlocked)
  }, [])

  const switchNetwork = useSwitchNetwork()

  const { legends, getLegends } = useLegendsContext()

  const closeModal = async () => {
    setIsOpen(false)
  }

  const setChestToUnlocked = useCallback(() => {
    unlockChainAnimation()
    setChestState('unlocked')
  }, [unlockChainAnimation])

  const treasureLegend: ChestCard | undefined = useMemo(
    () =>
      legends.find((legend) => isMatchingPredefinedId(legend.action, CARD_PREDEFINED_ID.chest)) as
        | ChestCard
        | undefined,
    [legends]
  )

  const isCompleted = treasureLegend?.card.status === CardStatus.completed

  const getButtonLabel = () => {
    switch (chestState) {
      case 'unlocking':
        return 'Unlocking...'
      case 'unlocked':
        return 'Open chest'
      case 'error':
        return 'Close'
      case 'opening':
        return 'Opening...'
      case 'opened':
        return <MidnightTimer type="minutes" />
      default:
        return 'Unlock chest'
    }
  }

  const action = treasureLegend?.action as CardActionCalls

  const unlockChest = useCallback(async () => {
    setIsInProgress(true)
    unlockChainAnimation()
    setChestState('unlocked')
    openChest()
    await switchNetwork()

    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    const formattedCalls = action.calls.map(([to, value, data]) => {
      return { to, value, data }
    })

    try {
      const sendCallsIdentifier = await sendCalls(
        chainId,
        await signer.getAddress(),
        formattedCalls,
        false
      )

      addToast('The chest will be opened shortly. ETA 10s')

      await getCallsStatus(sendCallsIdentifier)

      const transactionFound = await checkTransactionStatus(
        connectedAccount,
        'dailyReward',
        getLegends,
        setIsInProgress,
        setChestToUnlocked,
        addToast
      )
      if (!transactionFound) {
        const checkStatusWithTimeout = async (attempts: number) => {
          if (attempts >= 10) {
            console.error('Failed to fetch transaction status after 10 attempts')
            addToast(
              "We are unable to retrieve your prize at the moment. No worries, it will be displayed in your account's activity shortly.",
              { type: 'error' }
            )
            setChestState('error')
            return
          }
          const found = await checkTransactionStatus(
            connectedAccount,
            'dailyReward',
            getLegends,
            setIsInProgress,
            setChestToUnlocked,
            addToast
          )

          if (!found) {
            setTimeout(() => checkStatusWithTimeout(attempts + 1), 1000)
          }
        }

        await checkStatusWithTimeout(0)
      }
    } catch (e: any) {
      const message = humanizeLegendsBroadcastError(e)
      setIsInProgress(false)
      setChestState('locked')

      console.error(e)
      addToast(message || ERROR_MESSAGES.transactionProcessingFailed, { type: 'error' })
    }
  }, [
    switchNetwork,
    connectedAccount,
    getLegends,
    action?.calls,
    sendCalls,
    chainId,
    getCallsStatus,
    addToast,
    setIsInProgress,
    setChestToUnlocked
  ])

  const openChest = async () => {
    setChestState('opening')

    // Simulate the chest opening process
    setTimeout(() => {
      setChestState('opened')
      // Open another modal here
      // Example: setAnotherModalOpen(true)

      setCongratsModalOpen(true)
    }, 2000)
  }

  const onButtonClick = async () => {
    if (chestState === 'locked') {
      await unlockChest()
    } else if (chestState === 'unlocked') {
      await openChest()
    } else if (chestState === 'opened' || chestState === 'error') {
      await closeModal()
    }
  }

  const onCongratsModalButtonClick = async () => {
    setCongratsModalOpen(false)
  }

  if (!treasureLegend || !isOpen) {
    return null
  }

  return createPortal(
    <div>
      <div className={styles.backdrop}>
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <h2 className={styles.heading}>Daily Loot</h2>
            <button type="button" onClick={closeModal} className={styles.closeButton}>
              <CloseIcon />
            </button>
          </div>
          <div className={styles.content}>
            {treasureLegend.meta.points.map((point, index) => (
              <div
                key={point}
                className={
                  index === (treasureLegend.meta.points.length ?? 0) - 1 ? styles.last : ''
                }
              >
                <div
                  className={`${styles.day}  ${
                    (!isCompleted && index === treasureLegend.meta.streak) ||
                    index < (treasureLegend.meta.streak ?? -1)
                      ? styles.current
                      : ''
                  }`}
                >
                  <div className={styles.icon}>
                    +{point} <CoinIcon width={20} height={20} />
                  </div>
                  <p className={styles.dayText}>
                    {(isCompleted && (treasureLegend.meta.streak ?? 0) - 1 === index) ||
                    (!isCompleted && treasureLegend.meta.streak === index)
                      ? 'Today'
                      : `Day ${index + 1}`}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.chestWrapper}>
            <img src={chainImage} ref={chainRef} alt="chain" className={styles.chain} />
            <img src={chestImage} alt="spinner" className={styles.chest} />
          </div>

          <button
            type="button"
            className={styles.button}
            disabled={isCompleted || isInProgress}
            onClick={onButtonClick}
          >
            {getButtonLabel()}
          </button>
        </div>
      </div>

      <Modal isOpen={isCongratsModalOpen} setIsOpen={setCongratsModalOpen} className={styles.modal}>
        <div className={styles.congratsModal}>
          <Modal.Heading className={styles.title}>Congrats!</Modal.Heading>
          <Modal.Text className={styles.text}>
            You Collected {treasureLegend.meta.points[treasureLegend.meta.streak - 1] || 0} points
            today!
          </Modal.Text>
          <div className={styles.openedChestWrapper}>
            <div className={styles.prize}>
              +{treasureLegend.meta.points[treasureLegend.meta.streak - 1] || 0}
              <CoinIcon width={32} height={32} />{' '}
            </div>
            <img src={starImage} alt="star" className={styles.star} />

            <img src={chestImageOpened} alt="chest-opened" className={styles.chestOpenedImage} />
          </div>

          <button type="button" className={styles.button} onClick={onCongratsModalButtonClick}>
            Thanks, go back
          </button>
        </div>
      </Modal>
    </div>,
    document.getElementById('modal-root') as HTMLElement
  )
}

export default TreasureChestComponentModal

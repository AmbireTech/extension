/* eslint-disable no-console */
import { ethers, hexlify, Interface, randomBytes } from 'ethers'
import React, { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'

import { Legends as LEGENDS_CONTRACT_ABI } from '@ambire-common/libs/humanizer/const/abis/Legends'
import ConfettiAnimation from '@common/modules/dashboard/components/ConfettiAnimation'
import { RELAYER_URL } from '@env'
import { LEGENDS_CONTRACT_ADDRESS } from '@legends/constants/addresses'
import { BASE_CHAIN_ID } from '@legends/constants/network'
import { ActivityTransaction, LegendActivity } from '@legends/contexts/recentActivityContext/types'
import useAccountContext from '@legends/hooks/useAccountContext'
import useErc5792 from '@legends/hooks/useErc5792'
import useLegendsContext from '@legends/hooks/useLegendsContext'
import useToast from '@legends/hooks/useToast'

import chainImage from './assets/chain.png'
// @ts-ignore
import CloseIcon from './assets/close.svg'
import mainImage from './assets/main.png'
import pointerImage from './assets/pointer.png'
import spinnerImage from './assets/spinner.png'
import styles from './WheelComponentModal.module.scss'
import WHEEL_PRIZE_DATA from './wheelData'

export const LEGENDS_CONTRACT_INTERFACE = new Interface(LEGENDS_CONTRACT_ABI)

interface WheelComponentProps {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const POST_UNLOCK_STATES = ['unlocked', 'spinning', 'spun', 'error']

const WheelComponentModal: React.FC<WheelComponentProps> = ({ isOpen, setIsOpen }) => {
  const [prizeNumber, setPrizeNumber] = useState<null | number>(null)
  const [wheelState, setWheelState] = useState<
    'locked' | 'unlocking' | 'unlocked' | 'spinning' | 'spun' | 'error'
  >('locked')
  const { connectedAccount } = useAccountContext()
  const { onLegendComplete } = useLegendsContext()
  const { addToast } = useToast()
  const { sendCalls, getCallsStatus } = useErc5792()
  const spinnerRef = React.useRef<HTMLImageElement>(null)
  const chainRef = React.useRef<HTMLImageElement>(null)

  const stopSpinnerTeaseAnimation = useCallback(() => {
    if (!spinnerRef.current) return

    spinnerRef.current.style.animation = 'none'
    spinnerRef.current.style.transform = 'rotate(0deg)'
  }, [])

  const unlockChainAnimation = useCallback(() => {
    if (chainRef.current) chainRef.current.classList.add(styles.unlocked)
  }, [])

  const checkTransactionStatus = useCallback(async () => {
    try {
      const response = await fetch(`${RELAYER_URL}/legends/activity/${connectedAccount}`)

      if (!response.ok) throw new Error('Failed to fetch transaction status')

      const data = await response.json()
      const today = new Date().toISOString().split('T')[0]

      const transaction: ActivityTransaction | undefined = data.transactions.find(
        (txn: ActivityTransaction) =>
          txn.submittedAt.startsWith(today) &&
          txn.legends.activities &&
          txn.legends.activities.some((activity: LegendActivity) =>
            activity.action.startsWith('WheelOfFortune')
          )
      )

      if (!transaction) return false
      const spinWheelActivity = transaction.legends.activities.find((activity: any) => {
        return activity.action.includes('WheelOfFortune')
      })

      if (!spinWheelActivity) return false

      unlockChainAnimation()
      setPrizeNumber(spinWheelActivity.xp)
      setWheelState('unlocked')
      // Don't await this, we don't want to block the UI
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      return true
    } catch (error) {
      console.error('Error fetching transaction status:', error)
      return false
    }
  }, [connectedAccount, unlockChainAnimation])

  const unlockWheel = useCallback(async () => {
    // Switch to Base chain
    await window.ambire.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BASE_CHAIN_ID }]
    })

    const provider = new ethers.BrowserProvider(window.ambire)
    const signer = await provider.getSigner()

    try {
      stopSpinnerTeaseAnimation()
      setWheelState('unlocking')
      const randomValueBytes = randomBytes(32)
      const randomValue = BigInt(hexlify(randomValueBytes))

      const chainIdHex = ethers.toBeHex(BASE_CHAIN_ID)
      const callsId = await sendCalls(chainIdHex, await signer.getAddress(), [
        {
          to: LEGENDS_CONTRACT_ADDRESS,
          data: LEGENDS_CONTRACT_INTERFACE.encodeFunctionData('spinWheel', [randomValue])
        }
      ])

      addToast('The wheel will be unlocked shortly. ETA 10s', 'info')
      const receipt = await getCallsStatus(callsId)

      if (receipt && receipt.status === '0x1') {
        const transactionFound = await checkTransactionStatus()
        if (!transactionFound) {
          const checkStatusWithTimeout = async (attempts: number) => {
            if (attempts >= 10) {
              console.error('Failed to fetch transaction status after 10 attempts')
              addToast(
                "We are unable to retrieve your prize at the moment. No worries, it will be displayed in your account's activity shortly.",
                'error'
              )
              setWheelState('error')
              return
            }
            const found = await checkTransactionStatus()

            if (!found) {
              setTimeout(() => checkStatusWithTimeout(attempts + 1), 1000)
            }
          }

          await checkStatusWithTimeout(0)
        }
      }
    } catch (e) {
      console.error('Failed to broadcast transaction:', e)
      addToast('Failed to broadcast transaction', 'error')
      setWheelState('locked')
    }
  }, [stopSpinnerTeaseAnimation, checkTransactionStatus, addToast, sendCalls, getCallsStatus])

  const spinWheel = useCallback(async () => {
    if (!prizeNumber || wheelState !== 'unlocked') return

    // One prize can have multiple sectors
    const prizeSectors = WHEEL_PRIZE_DATA[prizeNumber]
    const amountOfSectors = prizeSectors.length
    // Select a random sector
    const randomSector = Math.floor(Math.random() * amountOfSectors)
    const sector =
      prizeSectors[randomSector > amountOfSectors - 1 ? amountOfSectors - 1 : randomSector]
    // Select a random point within the sector
    const randomDegrees = Math.floor(Math.random() * (sector.to - sector.from + 1) + sector.from)
    if (!spinnerRef.current) return

    // Start the animation
    spinnerRef.current.style.transform = `rotate(${-3960 + randomDegrees}deg)`
    setWheelState('spinning')

    setTimeout(() => {
      setWheelState('spun')
    }, 10000)
  }, [prizeNumber, wheelState])

  const closeModal = async () => {
    setIsOpen(false)
    if (wheelState === 'spun') {
      await onLegendComplete()
    }
  }

  const onButtonClick = async () => {
    if (wheelState === 'locked') {
      await unlockWheel()
    } else if (wheelState === 'unlocked') {
      await spinWheel()
    } else if (wheelState === 'spun' || wheelState === 'error') {
      await closeModal()
    }
  }

  const getButtonLabel = (): string => {
    switch (wheelState) {
      case 'unlocking':
        return 'Unlocking...'
      case 'unlocked':
        return 'Spin the Wheel'
      case 'error':
        return 'Close'
      case 'spinning':
        return 'Spinning...'
      case 'spun':
        if (!prizeNumber) return 'We are unable to retrieve your prize at the moment'
        return `You won ${prizeNumber} xp`
      default:
        return 'Unlock the Wheel'
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className={styles.backdrop}>
      <div
        className={styles.wrapper}
        style={{
          backgroundImage: `url(${mainImage})`
        }}
      >
        <div className={styles.content}>
          {wheelState === 'spun' ? (
            <ConfettiAnimation width={650} height={500} autoPlay loop className={styles.confetti} />
          ) : null}
          <button type="button" onClick={closeModal} className={styles.closeButton}>
            <img src={CloseIcon} width="32" height="32" alt="Close" />
          </button>
          <h2 className={styles.title}>Wheel of Fortune</h2>
          <img src={chainImage} ref={chainRef} alt="chain" className={styles.chain} />
          <img src={spinnerImage} alt="spinner" className={styles.spinner} ref={spinnerRef} />
          <img src={pointerImage} alt="pointer" className={styles.pointer} />
          <button
            disabled={wheelState === 'spinning' || wheelState === 'unlocking'}
            type="button"
            className={`${styles.spinButton} ${
              POST_UNLOCK_STATES.includes(wheelState) ? styles.unlocked : ''
            }`}
            onClick={onButtonClick}
          >
            {getButtonLabel()}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') as HTMLElement
  )
}

export default WheelComponentModal

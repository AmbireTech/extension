/* eslint-disable no-console */
import { ethers, hexlify, Interface, randomBytes } from 'ethers'
import React, { useCallback, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { Legends as LEGENDS_CONTRACT_ABI } from '@ambire-common/libs/humanizer/const/abis/Legends'
import ConfettiAnimation from '@common/modules/dashboard/components/ConfettiAnimation'
// @ts-ignore
import CloseIcon from '@legends/components/CloseIcon'
import { LEGENDS_CONTRACT_ADDRESS } from '@legends/constants/addresses'
import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import { BASE_CHAIN_ID } from '@legends/constants/networks'
import useAccountContext from '@legends/hooks/useAccountContext'
import useErc5792 from '@legends/hooks/useErc5792'
import useEscModal from '@legends/hooks/useEscModal'
import useLegendsContext from '@legends/hooks/useLegendsContext'
import useSwitchNetwork from '@legends/hooks/useSwitchNetwork'
import useToast from '@legends/hooks/useToast'
import { checkTransactionStatus } from '@legends/modules/legends/helpers'
import { getRewardsButtonText } from '@legends/utils/getRewardsButtonText'

import { humanizeError } from '../../utils/errors/humanizeError'
import chainImage from './assets/chain.png'
import pointerImage from './assets/pointer.png'
import smokeAndLights from './assets/smoke-and-lights-background.png'
import spinnerImage from './assets/spinner.png'
import styles from './WheelComponentModal.module.scss'
import WHEEL_PRIZE_DATA from './wheelData'

export const LEGENDS_CONTRACT_INTERFACE = new Interface(LEGENDS_CONTRACT_ABI)

interface WheelComponentProps {
  isOpen: boolean
  handleClose: () => void
}

const POST_UNLOCK_STATES = ['unlocked', 'spinning', 'spun', 'error']

const WheelComponentModal: React.FC<WheelComponentProps> = ({ isOpen, handleClose }) => {
  const switchNetwork = useSwitchNetwork()
  const [prizeNumber, setPrizeNumber] = useState<null | number>(30)
  const [wheelState, setWheelState] = useState<
    'locked' | 'unlocking' | 'unlocked' | 'spinning' | 'spun' | 'error'
  >('locked')

  const { connectedAccount, v1Account } = useAccountContext()

  const buttonText = getRewardsButtonText({
    connectedAccount,
    v1Account: !!v1Account
  })

  const { onLegendComplete } = useLegendsContext()
  const { addToast } = useToast()
  const { sendCalls, getCallsStatus } = useErc5792()
  const spinnerRef = React.useRef<HTMLImageElement>(null)
  const chainRef = React.useRef<HTMLImageElement>(null)
  const nonConnectedAcc = Boolean(!connectedAccount || v1Account)

  const stopSpinnerTeaseAnimation = useCallback(() => {
    if (!spinnerRef.current) return

    spinnerRef.current.style.animation = 'none'
    spinnerRef.current.style.transform = 'rotate(0deg)'
  }, [])

  const unlockChainAnimation = useCallback(() => {
    if (chainRef.current) chainRef.current.classList.add(styles.unlocked)
  }, [])

  const setWheelToUnlocked = useCallback(
    (receivedXp?: number | null) => {
      unlockChainAnimation()
      receivedXp && setPrizeNumber(receivedXp)
      setWheelState('unlocked')
    },
    [unlockChainAnimation]
  )

  const unlockWheel = useCallback(async () => {
    try {
      await switchNetwork(BASE_CHAIN_ID)

      const provider = new ethers.BrowserProvider(window.ambire)
      const signer = await provider.getSigner()

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

      addToast('The wheel will be unlocked shortly. ETA 10s')

      await getCallsStatus(callsId)

      const transactionFound = await checkTransactionStatus(
        connectedAccount,
        'WheelOfFortune',
        setWheelToUnlocked
      )
      if (!transactionFound) {
        const checkStatusWithTimeout = async (attempts: number) => {
          if (attempts >= 15) {
            console.error('Failed to fetch transaction status after 15 attempts')
            addToast(
              "We are unable to retrieve your prize at the moment. No worries, it will be displayed in your account's activity shortly.",
              { type: 'error' }
            )
            setWheelState('error')
            return
          }
          const found = await checkTransactionStatus(
            connectedAccount,
            'WheelOfFortune',
            setWheelToUnlocked
          )

          if (!found) {
            setTimeout(() => checkStatusWithTimeout(attempts + 1), 2000)
          }
        }

        await checkStatusWithTimeout(0)
      }
    } catch (e) {
      const message = humanizeError(e, ERROR_MESSAGES.transactionSigningFailed)

      console.error(e)
      addToast(message, { type: 'error' })
      setWheelState('locked')
    }
  }, [
    switchNetwork,
    stopSpinnerTeaseAnimation,
    sendCalls,
    addToast,
    getCallsStatus,
    connectedAccount,
    setWheelToUnlocked
  ])

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
    handleClose()
    if (wheelState === 'spun') {
      await onLegendComplete()
    }
  }

  // Close Modal on ESC
  useEscModal(isOpen, closeModal)

  const onButtonClick = async () => {
    if (wheelState === 'locked') {
      await unlockWheel()
    } else if (wheelState === 'unlocked') {
      await spinWheel()
    } else if (wheelState === 'spun' || wheelState === 'error') {
      await closeModal()
    }
  }

  const buttonLabel = useMemo((): string => {
    switch (wheelState) {
      case 'unlocking':
        return 'Unlocking...'
      case 'unlocked':
        return 'Spin The Wheel'
      case 'error':
        return 'Close'
      case 'spinning':
        return 'Spinning...'
      case 'spun':
        if (!prizeNumber) return 'We are unable to retrieve your prize at the moment'
        return 'Close'
      default:
        return 'Unlock The Wheel'
    }
  }, [wheelState, prizeNumber])

  if (!isOpen) return null

  return createPortal(
    <div className={styles.backdrop}>
      <div className={styles.wrapper}>
        <div
          className={styles.backgroundEffect}
          style={{
            backgroundImage: `url(${smokeAndLights})`
          }}
        />
        <div className={styles.content}>
          {wheelState === 'spun' ? (
            <ConfettiAnimation width={650} height={500} autoPlay loop className={styles.confetti} />
          ) : null}
          <button type="button" onClick={closeModal} className={styles.closeButton}>
            <CloseIcon />
          </button>
          <h2 className={styles.title}>Wheel of Fortune</h2>
          <img src={chainImage} ref={chainRef} alt="chain" className={styles.chain} />
          <img src={spinnerImage} alt="spinner" className={styles.spinner} ref={spinnerRef} />
          <img src={pointerImage} alt="pointer" className={styles.pointer} />
          <button
            disabled={nonConnectedAcc || wheelState === 'spinning' || wheelState === 'unlocking'}
            type="button"
            className={`${styles.spinButton} ${
              POST_UNLOCK_STATES.includes(wheelState) ? styles.unlocked : ''
            }`}
            onClick={onButtonClick}
          >
            {nonConnectedAcc ? buttonText : buttonLabel}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') as HTMLElement
  )
}

export default WheelComponentModal

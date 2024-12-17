import React, { FC, useMemo, useState } from 'react'

import CopyIcon from '@common/assets/svg/CopyIcon'
import Modal from '@legends/components/Modal'
import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import useLegendsContext from '@legends/hooks/useLegendsContext'
import useRecentActivityContext from '@legends/hooks/useRecentActivityContext'
import useToast from '@legends/hooks/useToast'
import ActionModal from '@legends/modules/legends/components/ActionModal'
import Counter from '@legends/modules/legends/components/Card/Counter'
import Flask from '@legends/modules/legends/components/Card/Flask'
import Rewards from '@legends/modules/legends/components/Card/Rewards'
import WheelComponent from '@legends/modules/legends/components/WheelComponentModal'
import { timeUntilMidnight } from '@legends/modules/legends/components/WheelComponentModal/helpers'
import { CARD_PREDEFINED_ID, PREDEFINED_ACTION_LABEL_MAP } from '@legends/modules/legends/constants'
import {
  CardActionType,
  CardFromResponse,
  CardStatus,
  CardType
} from '@legends/modules/legends/types'
import { isMatchingPredefinedId } from '@legends/modules/legends/utils/cards'

import styles from './Card.module.scss'

type Props = Pick<
  CardFromResponse,
  | 'title'
  | 'description'
  | 'flavor'
  | 'xp'
  | 'image'
  | 'card'
  | 'action'
  | 'timesCollectedToday'
  | 'meta'
  | 'contentSteps'
  | 'contentImage'
  | 'contentVideo'
>

const CARD_FREQUENCY: { [key in CardType]: string } = {
  [CardType.daily]: 'Daily',
  [CardType.oneTime]: 'One-time',
  [CardType.recurring]: 'Ongoing',
  [CardType.weekly]: 'Weekly'
}

const Card: FC<Props> = ({
  title,
  image,
  description,
  flavor,
  xp,
  timesCollectedToday,
  card,
  action,
  meta,
  contentSteps,
  contentImage,
  contentVideo
}) => {
  const { getActivity } = useRecentActivityContext()
  const { onLegendComplete } = useLegendsContext()
  const { addToast } = useToast()

  const disabled = card.status === CardStatus.disabled
  const isCompleted = card.status === CardStatus.completed
  const predefinedId = action.type === CardActionType.predefined ? action.predefinedId : ''
  const buttonText = PREDEFINED_ACTION_LABEL_MAP[predefinedId] || 'Proceed'
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isOnLegendCompleteModalOpen, setIsOnLegendCompleteModalOpen] = useState(false)

  const [isFortuneWheelModalOpen, setIsFortuneWheelModalOpen] = useState(false)

  const openActionModal = () =>
    isMatchingPredefinedId(action, CARD_PREDEFINED_ID.wheelOfFortune)
      ? setIsFortuneWheelModalOpen(true)
      : setIsActionModalOpen(true)

  const closeActionModal = () =>
    isMatchingPredefinedId(action, CARD_PREDEFINED_ID.wheelOfFortune)
      ? setIsFortuneWheelModalOpen(false)
      : setIsActionModalOpen(false)

  const pollActivityUntilComplete = async (txnId: string, attempt: number) => {
    if (attempt > 10) {
      addToast(ERROR_MESSAGES.transactionProcessingFailed, 'error')
      return
    }

    // We can't rely on state as it's not updated due to the self-invoking nature of the function
    const newActivity = await getActivity()

    const foundTxn = newActivity?.transactions?.find((txn) => txn.txId === txnId)

    if (!foundTxn) {
      if (attempt === 0) {
        addToast('We are processing your transaction. Expect your reward shortly.', 'info')
      }

      setTimeout(() => pollActivityUntilComplete(txnId, attempt + 1), 1000)
      return
    }

    const latestXpReward = foundTxn.legends.totalXp

    if (latestXpReward) {
      addToast(`Transaction completed! Reward ${latestXpReward} XP`, 'success')
    } else {
      addToast('Transaction completed!', 'success')
    }

    // Update all other states
    await onLegendComplete()
  }

  const onLegendCompleteWrapped = async (txnId: string) => {
    await pollActivityUntilComplete(txnId, 0)

    if (isMatchingPredefinedId(action, CARD_PREDEFINED_ID.addEOA)) {
      setIsOnLegendCompleteModalOpen(true)
    }
  }

  const hoursUntilMidnightLabel = useMemo(() => timeUntilMidnight().label, [])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(
        `🤑Join the biggest airdrop a WALLET has ever done! 🚀 \n \nAmbire Wallet is giving away 195M $WALLET tokens through the Ambire Legends campaign. All activity with a Smart Account on 5 of the hottest EVM chains is rewarded. Start strong with the first 4 transactions free! \n \nHere’s what you need to do: \n1. Download the Ambire extension: https://www.ambire.com/get-extension \n2. Use my referral code so we both get XP: ${
          meta?.invitationKey || ''
        }\n3. Create a Smart Account in the extension and join Ambire Legends at https://legends.ambire.com/`
      )
      addToast('Text with referral code copied to clipboard', 'success')
    } catch (e: any) {
      addToast('Failed to copy referral code', 'error')
      console.error(e)
    }
  }

  const closeAndCopy = () => {
    copyToClipboard()
    setIsOnLegendCompleteModalOpen(false)
  }

  return (
    <div className={`${styles.wrapper} ${disabled && styles.disabled}`}>
      <Modal isOpen={isOnLegendCompleteModalOpen} setIsOpen={setIsOnLegendCompleteModalOpen}>
        <>
          <div> 🎉 Congratulations! 🎉</div>
          <br />
          The EOA address has been successfully added to your referred friends. <br /> Now is your
          turn to invite them in a way they couldn&apos;t refuse.
          <br />
          Here is an example:
          <br />
          <div className={styles.copySectionWrapper}>
            <div className={styles.copyField}>
              <div>
                ⚠️ TRADE OFFER ⚠️ <br />
                You download Ambire, we both win 🎉 <br /> 1. Download the Ambire extension:{' '}
                <a
                  target="_blank"
                  href="https://www.ambire.com/get-extension"
                  rel="noreferrer"
                  className={styles.link}
                >
                  https://www.ambire.com/get-extension
                </a>
                <br /> 2. Use my referral code so we both get XP: {meta?.invitationKey} <br /> 3.
                Join Ambire Legends - on-chain quests by Ambire with XP and rewards:{' '}
                <a
                  target="_blank"
                  href="https://legends.ambire.com/"
                  rel="noreferrer"
                  className={styles.link}
                >
                  https://legends.ambire.com/{' '}
                </a>
              </div>
              <CopyIcon className={styles.copyIcon} onClick={copyToClipboard} />
            </div>
          </div>
          <button onClick={closeAndCopy} type="button" className={styles.button}>
            Copy and close
          </button>
        </>
      </Modal>
      <ActionModal
        isOpen={isActionModalOpen}
        setIsOpen={setIsActionModalOpen}
        title={title}
        flavor={flavor}
        xp={xp}
        contentSteps={contentSteps}
        contentImage={contentImage}
        contentVideo={contentVideo}
        buttonText={buttonText}
        onLegendCompleteWrapped={onLegendCompleteWrapped}
        closeActionModal={closeActionModal}
        copyToClipboard={copyToClipboard}
        action={action}
        meta={meta}
        predefinedId={predefinedId}
      />
      {isMatchingPredefinedId(action, CARD_PREDEFINED_ID.wheelOfFortune) && (
        <WheelComponent isOpen={isFortuneWheelModalOpen} setIsOpen={setIsFortuneWheelModalOpen} />
      )}
      {isCompleted ? (
        <div className={styles.completed}>
          <Flask />
          <div className={styles.completedText}>
            Completed
            {isMatchingPredefinedId(action, CARD_PREDEFINED_ID.wheelOfFortune) ? (
              <div className={styles.completedTextAvailable}>{hoursUntilMidnightLabel}</div>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className={styles.imageAndCounter}>
        <button
          disabled={disabled}
          type="button"
          onClick={openActionModal}
          className={styles.imageButtonWrapper}
        >
          <img src={image} alt={title} className={styles.image} />
        </button>
        <Counter width={48} height={48} count={timesCollectedToday} className={styles.counter} />
      </div>
      <div className={styles.contentAndAction}>
        <div className={styles.content}>
          <h2 className={styles.heading}>{title}</h2>
          <p className={styles.description}>{description}</p>
          <span className={styles.rewardFrequency}>{CARD_FREQUENCY[card.type]}</span>
          <div className={styles.rewards}>
            <Rewards xp={xp} size="sm" reverse />
          </div>
        </div>
        <button
          disabled={disabled}
          className={styles.button}
          type="button"
          onClick={openActionModal}
        >
          {action.type ? buttonText : 'Read more'}
        </button>
      </div>
    </div>
  )
}

export default React.memo(Card)

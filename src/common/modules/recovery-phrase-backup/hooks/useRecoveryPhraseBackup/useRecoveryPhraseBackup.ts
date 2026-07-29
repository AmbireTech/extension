import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import eventBus from '@common/services/event/eventBus'
import { setStringAsync } from '@common/utils/clipboard'

export type RecoveryPhraseBackupStep = 'unlock' | 'reveal' | 'confirm'

export type WordToConfirm = {
  /** 1 based position of the word inside the phrase, as shown to the user */
  position: number
  word: string
}

const WORDS_TO_CONFIRM_COUNT = 3

/**
 * Picks one word out of every equally sized part of the phrase, so the user has to
 * have written down the whole thing, not just the beginning.
 */
const pickWordsToConfirm = (words: string[]): WordToConfirm[] => {
  const partSize = Math.floor(words.length / WORDS_TO_CONFIRM_COUNT)

  return Array.from({ length: WORDS_TO_CONFIRM_COUNT }, (_, partIndex) => {
    const offset = Math.floor(Math.random() * partSize)
    const index = partIndex * partSize + offset

    return { position: index + 1, word: words[index] as string }
  })
}

export default function useRecoveryPhraseBackup({
  seedId,
  onBackedUp
}: {
  seedId: string
  onBackedUp: () => void
}) {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const {
    state: { statuses, errorMessage },
    dispatch: keystoreDispatch
  } = useController('KeystoreController')

  const [step, setStep] = useState<RecoveryPhraseBackupStep>('unlock')
  const [seed, setSeed] = useState<string | null>(null)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [enteredWords, setEnteredWords] = useState<string[]>([])
  // The SUCCESS status can be collapsed away before the UI renders it, so completion is
  // derived from having seen LOADING and then no longer being in it, without an error.
  const hasSeenUnlockLoading = useRef(false)
  // `receiveOneTimeData` is a global event, so other screens revealing a phrase must not
  // be able to push this flow past its unlock step
  const isAwaitingSeed = useRef(false)

  const seedWords = useMemo(() => (seed ? seed.split(' ') : []), [seed])
  const [wordsToConfirm, setWordsToConfirm] = useState<WordToConfirm[]>([])

  useEffect(() => {
    const onReceiveOneTimeData = (data: any) => {
      if (!data.seed || !isAwaitingSeed.current) return

      isAwaitingSeed.current = false
      setSeed(data.seed)
      setStep('reveal')
    }

    eventBus.addEventListener('receiveOneTimeData', onReceiveOneTimeData)

    return () => eventBus.removeEventListener('receiveOneTimeData', onReceiveOneTimeData)
  }, [])

  const resetKeystoreErrorIfNeeded = useCallback(() => {
    if (!errorMessage) return

    keystoreDispatch({ type: 'method', params: { method: 'resetErrorState', args: [] } })
  }, [errorMessage, keystoreDispatch])

  const unlock = useCallback(
    (secretId: 'password' | 'biometrics', secret: string) => {
      hasSeenUnlockLoading.current = false
      setIsUnlocking(true)
      keystoreDispatch({
        type: 'method',
        params: { method: 'unlockWithSecret', args: [secretId, secret] }
      })
    },
    [keystoreDispatch]
  )

  useEffect(() => {
    if (!isUnlocking) return

    if (errorMessage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsUnlocking(false)
      return
    }

    if (statuses.unlockWithSecret === 'LOADING') {
      hasSeenUnlockLoading.current = true
      return
    }

    if (!hasSeenUnlockLoading.current) return

    setIsUnlocking(false)
    isAwaitingSeed.current = true
    keystoreDispatch({ type: 'method', params: { method: 'sendSeedToUi', args: [seedId] } })
  }, [errorMessage, isUnlocking, keystoreDispatch, seedId, statuses.unlockWithSecret])

  const goToConfirmStep = useCallback(() => {
    setWordsToConfirm(pickWordsToConfirm(seedWords))
    setEnteredWords(Array.from({ length: WORDS_TO_CONFIRM_COUNT }, () => ''))
    setStep('confirm')
  }, [seedWords])

  const setEnteredWord = useCallback((index: number, value: string) => {
    setEnteredWords((prev) => prev.map((word, i) => (i === index ? value : word)))
  }, [])

  const areEnteredWordsValid = useMemo(
    () =>
      wordsToConfirm.length > 0 &&
      wordsToConfirm.every(({ word }, index) => enteredWords[index]?.trim() === word),
    [enteredWords, wordsToConfirm]
  )

  const copySeedToClipboard = useCallback(async () => {
    if (!seed) return

    try {
      await setStringAsync(seed)
      addToast(t('Recovery phrase copied to clipboard'))
    } catch (error) {
      console.error(error)
      addToast(t('Failed to copy recovery phrase'), { type: 'error' })
    }
  }, [addToast, seed, t])

  const finishBackup = useCallback(() => {
    if (!areEnteredWordsValid) return

    keystoreDispatch({ type: 'method', params: { method: 'markSeedAsBackedUp', args: [seedId] } })
    onBackedUp()
  }, [areEnteredWordsValid, keystoreDispatch, onBackedUp, seedId])

  // Keep the phrase in memory only for as long as the flow is open
  const reset = useCallback(() => {
    setSeed(null)
    setWordsToConfirm([])
    setEnteredWords([])
    setStep('unlock')
    setIsUnlocking(false)
    hasSeenUnlockLoading.current = false
    isAwaitingSeed.current = false
    resetKeystoreErrorIfNeeded()
  }, [resetKeystoreErrorIfNeeded])

  return {
    step,
    seedWords,
    isUnlocking,
    unlockErrorMessage: errorMessage,
    unlock,
    resetKeystoreErrorIfNeeded,
    goToConfirmStep,
    goBackToRevealStep: useCallback(() => setStep('reveal'), []),
    wordsToConfirm,
    enteredWords,
    setEnteredWord,
    areEnteredWordsValid,
    copySeedToClipboard,
    finishBackup,
    reset
  }
}

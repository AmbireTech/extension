import { wordlists } from 'bip39'
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
  /** The correct word plus decoys, in the order they are offered to the user */
  options: string[]
}

const WORDS_TO_CONFIRM_COUNT = 3
const DECOYS_PER_WORD = 2

const shuffle = <T>(items: T[]): T[] => {
  const shuffled = [...items]

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))

    ;[shuffled[i], shuffled[j]] = [shuffled[j] as T, shuffled[i] as T]
  }

  return shuffled
}

/**
 * Offers the correct word among decoys taken from the BIP39 wordlist, so picking the
 * right one is only possible by having the phrase written down.
 */
const buildOptions = (word: string): string[] => {
  const decoyPool = (wordlists.english || []).filter((candidate) => candidate !== word)
  const decoys = shuffle(decoyPool).slice(0, DECOYS_PER_WORD)

  return shuffle([word, ...decoys])
}

/**
 * Picks one word out of every equally sized part of the phrase, so the user has to
 * have written down the whole thing, not just the beginning.
 */
const pickWordsToConfirm = (words: string[]): WordToConfirm[] => {
  const partSize = Math.floor(words.length / WORDS_TO_CONFIRM_COUNT)

  return Array.from({ length: WORDS_TO_CONFIRM_COUNT }, (_, partIndex) => {
    const offset = Math.floor(Math.random() * partSize)
    const index = partIndex * partSize + offset
    const word = words[index] as string

    return { position: index + 1, word, options: buildOptions(word) }
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
  const [selectedWords, setSelectedWords] = useState<string[]>([])
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
    setSelectedWords(Array.from({ length: WORDS_TO_CONFIRM_COUNT }, () => ''))
    setStep('confirm')
  }, [seedWords])

  const selectWord = useCallback((index: number, value: string) => {
    setSelectedWords((prev) => prev.map((word, i) => (i === index ? value : word)))
  }, [])

  const areSelectedWordsValid = useMemo(
    () =>
      wordsToConfirm.length > 0 &&
      wordsToConfirm.every(({ word }, index) => selectedWords[index] === word),
    [selectedWords, wordsToConfirm]
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
    if (!areSelectedWordsValid) return

    keystoreDispatch({ type: 'method', params: { method: 'markSeedAsBackedUp', args: [seedId] } })
    onBackedUp()
  }, [areSelectedWordsValid, keystoreDispatch, onBackedUp, seedId])

  // Keep the phrase in memory only for as long as the flow is open
  const reset = useCallback(() => {
    setSeed(null)
    setWordsToConfirm([])
    setSelectedWords([])
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
    selectedWords,
    selectWord,
    areSelectedWordsValid,
    copySeedToClipboard,
    finishBackup,
    reset
  }
}

import { useCallback, useState } from 'react'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type Seed = AllControllersMappingType['KeystoreController']['seeds'][number]

export type EnteredSeedPassphrase = { seedPassphrase: string; shouldSavePassphrase: boolean }

/**
 * Runs `onReady` for a saved recovery phrase, first asking for its passphrase when it isn't
 * saved. Render `EnterSeedPassphraseBottomSheet` while `seedToEnterPassphraseFor` is set.
 */
const useSeedPassphraseGate = (
  onReady: (seedId: string, passphrase?: EnteredSeedPassphrase) => void
) => {
  // The phrase whose passphrase is asked for, as it isn't saved. The sheet is mounted only then
  const [seedToEnterPassphraseFor, setSeedToEnterPassphraseFor] = useState<Seed | null>(null)

  const requestSeed = useCallback(
    (seed: Seed) => {
      if (seed.withPassphrase && !seed.isPassphraseSaved) {
        setSeedToEnterPassphraseFor(seed)
        return
      }

      onReady(seed.id)
    },
    [onReady]
  )

  const handlePassphraseConfirmed = useCallback(
    (passphrase: EnteredSeedPassphrase) => {
      if (seedToEnterPassphraseFor) onReady(seedToEnterPassphraseFor.id, passphrase)
    },
    [onReady, seedToEnterPassphraseFor]
  )

  const unmountPassphraseSheet = useCallback(() => setSeedToEnterPassphraseFor(null), [])

  return {
    seedToEnterPassphraseFor,
    requestSeed,
    handlePassphraseConfirmed,
    unmountPassphraseSheet
  }
}

export default useSeedPassphraseGate

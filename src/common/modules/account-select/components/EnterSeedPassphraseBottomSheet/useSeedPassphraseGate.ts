import { useCallback, useState } from 'react'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type Seed = AllControllersMappingType['KeystoreController']['seeds'][number]

export type EnteredSeedPassphrase = { seedPassphrase: string; shouldSavePassphrase: boolean }

/**
 * Runs `onReady` for a saved recovery phrase, first asking for its passphrase when it isn't
 * saved. Render `EnterSeedPassphraseBottomSheet` while `seedToEnterPassphraseFor` is set.
 * `onReady` resolves with whether the passphrase was wrong, which the sheet then shows.
 */
const useSeedPassphraseGate = (
  onReady: (seedId: string, passphrase?: EnteredSeedPassphrase) => Promise<boolean>
) => {
  // The phrase whose passphrase is asked for, as it isn't saved. The sheet is mounted only then
  const [seedToEnterPassphraseFor, setSeedToEnterPassphraseFor] = useState<Seed | null>(null)

  const requestSeed = useCallback(
    (seed: Seed) => {
      if (seed.isPassphraseNeeded) {
        setSeedToEnterPassphraseFor(seed)
        return
      }

      // Nothing to show without the sheet, and `onReady` reports its own failures
      void onReady(seed.id)
    },
    [onReady]
  )

  const handlePassphraseSubmit = useCallback(
    async (passphrase: EnteredSeedPassphrase) =>
      !!seedToEnterPassphraseFor && onReady(seedToEnterPassphraseFor.id, passphrase),
    [onReady, seedToEnterPassphraseFor]
  )

  const unmountPassphraseSheet = useCallback(() => setSeedToEnterPassphraseFor(null), [])

  return {
    seedToEnterPassphraseFor,
    requestSeed,
    handlePassphraseSubmit,
    unmountPassphraseSheet
  }
}

export default useSeedPassphraseGate

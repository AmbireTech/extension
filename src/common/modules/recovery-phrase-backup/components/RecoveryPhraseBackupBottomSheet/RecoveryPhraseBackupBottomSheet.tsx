import React, { useCallback } from 'react'
import { Modalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useToast from '@common/hooks/useToast'
import BackupConfirmStep from '@common/modules/recovery-phrase-backup/components/BackupConfirmStep'
import BackupRevealStep from '@common/modules/recovery-phrase-backup/components/BackupRevealStep'
import BackupUnlockStep from '@common/modules/recovery-phrase-backup/components/BackupUnlockStep'
import useRecoveryPhraseBackup from '@common/modules/recovery-phrase-backup/hooks/useRecoveryPhraseBackup'
import spacings from '@common/styles/spacings'

type Props = {
  seedId: string
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  onBackedUp?: () => void
}

const RecoveryPhraseBackupBottomSheet = ({
  seedId,
  sheetRef,
  closeBottomSheet,
  onBackedUp
}: Props) => {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const handleBackedUp = useCallback(() => {
    addToast(t('Recovery phrase backed up successfully'))
    closeBottomSheet()
    onBackedUp?.()
  }, [addToast, closeBottomSheet, onBackedUp, t])

  const {
    step,
    seedWords,
    isUnlocking,
    unlockErrorMessage,
    unlock,
    resetKeystoreErrorIfNeeded,
    goToConfirmStep,
    goBackToRevealStep,
    wordsToConfirm,
    enteredWords,
    setEnteredWord,
    areEnteredWordsValid,
    copySeedToClipboard,
    finishBackup,
    reset
  } = useRecoveryPhraseBackup({ seedId, onBackedUp: handleBackedUp })

  const handleClose = useCallback(() => {
    if (step === 'confirm') {
      goBackToRevealStep()
      return
    }

    closeBottomSheet()
  }, [closeBottomSheet, goBackToRevealStep, step])

  return (
    <BottomSheet
      id={`recovery-phrase-backup-bottom-sheet-${seedId}`}
      type={isWeb ? 'modal' : 'bottom-sheet'}
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      onClosed={reset}
      scrollViewProps={isWeb ? { contentContainerStyle: { flex: 1 } } : undefined}
      containerInnerWrapperStyles={{ flex: 1 }}
      style={isWeb ? { maxWidth: 432, minHeight: 432, ...spacings.pvLg } : undefined}
    >
      <ModalHeader
        handleClose={handleClose}
        title={t('Backup recovery phrase')}
        forceBackButtonOnMobile
      />
      {step === 'unlock' && (
        <BackupUnlockStep
          isUnlocking={isUnlocking}
          unlockErrorMessage={unlockErrorMessage}
          onUnlock={unlock}
          onPasswordChange={resetKeystoreErrorIfNeeded}
        />
      )}
      {step === 'reveal' && (
        <BackupRevealStep
          seedWords={seedWords}
          onCopyPress={copySeedToClipboard}
          onContinuePress={goToConfirmStep}
        />
      )}
      {step === 'confirm' && (
        <BackupConfirmStep
          wordsToConfirm={wordsToConfirm}
          enteredWords={enteredWords}
          onEnteredWordChange={setEnteredWord}
          areEnteredWordsValid={areEnteredWordsValid}
          onFinishPress={finishBackup}
        />
      )}
    </BottomSheet>
  )
}

export default React.memo(RecoveryPhraseBackupBottomSheet)

import React, { useCallback, useState } from 'react'
import { LayoutChangeEvent, View } from 'react-native'
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
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  seedId: string
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
}

const RecoveryPhraseBackupBottomSheet = ({ seedId, sheetRef, closeBottomSheet }: Props) => {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const handleBackedUp = useCallback(() => {
    addToast(t('Recovery phrase backed up successfully'))
    closeBottomSheet()
  }, [addToast, closeBottomSheet, t])

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
    selectedWords,
    selectWord,
    areSelectedWordsValid,
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

  const [tallestStepHeight, setTallestStepHeight] = useState(0)

  const handleStepLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    const { height } = nativeEvent.layout

    setTallestStepHeight((prevHeight) => (height > prevHeight ? height : prevHeight))
  }, [])

  const handleClosed = useCallback(() => {
    setTallestStepHeight(0)
    reset()
  }, [reset])

  return (
    <BottomSheet
      id={`recovery-phrase-backup-bottom-sheet-${seedId}`}
      type={isWeb ? 'modal' : 'bottom-sheet'}
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      onClosed={handleClosed}
      scrollViewProps={isWeb ? { contentContainerStyle: { flex: 1 } } : undefined}
      containerInnerWrapperStyles={{ flex: 1 }}
      style={isWeb ? { maxWidth: 432, minHeight: 432, ...spacings.pvLg } : undefined}
    >
      <ModalHeader handleClose={handleClose} title={t('Backup recovery phrase')} />
      {step === 'unlock' && (
        <BackupUnlockStep
          isUnlocking={isUnlocking}
          unlockErrorMessage={unlockErrorMessage}
          onUnlock={unlock}
          onPasswordChange={resetKeystoreErrorIfNeeded}
        />
      )}
      {step !== 'unlock' && (
        <View
          onLayout={handleStepLayout}
          style={[flexbox.flex1, tallestStepHeight ? { minHeight: tallestStepHeight } : {}]}
        >
          {step === 'reveal' ? (
            <BackupRevealStep
              seedWords={seedWords}
              onCopyPress={copySeedToClipboard}
              onContinuePress={goToConfirmStep}
            />
          ) : (
            <BackupConfirmStep
              wordsToConfirm={wordsToConfirm}
              selectedWords={selectedWords}
              onWordSelect={selectWord}
              areSelectedWordsValid={areSelectedWordsValid}
              onGoBackPress={goBackToRevealStep}
              onFinishPress={finishBackup}
            />
          )}
        </View>
      )}
    </BottomSheet>
  )
}

export default React.memo(RecoveryPhraseBackupBottomSheet)

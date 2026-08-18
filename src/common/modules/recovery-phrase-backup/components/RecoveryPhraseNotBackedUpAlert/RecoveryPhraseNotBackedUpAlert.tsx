import React from 'react'
import { ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import Alert from '@common/components/Alert'
import { useTranslation } from '@common/config/localization'
import RecoveryPhraseBackupBottomSheet from '@common/modules/recovery-phrase-backup/components/RecoveryPhraseBackupBottomSheet'

/**
 * Soft reminder shown next to a recovery phrase that holds funds but was never
 * written down. Kept as a warning (not an error) on purpose - nothing is broken,
 * the user just has something to lose now.
 */
const RecoveryPhraseNotBackedUpAlert = ({
  seedId,
  style
}: {
  seedId: string
  style?: ViewStyle
}) => {
  const { t } = useTranslation()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  return (
    <>
      <Alert
        testID={`recovery-phrase-not-backed-up-alert-${seedId}`}
        type="warning"
        title={t('Phrase not backed up!')}
        text={t(
          'If your device gets lost or stolen, you will lose your wallet and all your funds.'
        )}
        style={style}
        buttonProps={{
          testID: `back-up-recovery-phrase-${seedId}`,
          text: t('Back up now'),
          onPress: openBottomSheet as any
        }}
      />
      <RecoveryPhraseBackupBottomSheet
        seedId={seedId}
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
      />
    </>
  )
}

export default React.memo(RecoveryPhraseNotBackedUpAlert)

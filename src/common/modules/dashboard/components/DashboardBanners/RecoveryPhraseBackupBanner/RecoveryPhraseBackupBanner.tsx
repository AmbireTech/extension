import React, { useCallback, useState } from 'react'
import { useModalize } from 'react-native-modalize'

import Banner from '@common/components/Banner'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import RecoveryPhraseBackupBottomSheet from '@common/modules/recovery-phrase-backup/components/RecoveryPhraseBackupBottomSheet'
import useRecoveryPhraseBackupStatus from '@common/modules/recovery-phrase-backup/hooks/useRecoveryPhraseBackupStatus'

/**
 * Nudges the user to write down the recovery phrase of the selected account once it
 * holds funds. It cannot be dismissed - it stays until the phrase is backed up, and is
 * then replaced by a dismissible confirmation.
 */
const RecoveryPhraseBackupBanner = () => {
  const { t } = useTranslation()
  const { account } = useController('SelectedAccountController').state
  const { seedIdOfSelectedAccountNeedingBackup } = useRecoveryPhraseBackupStatus()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  // Tied to an account, so the confirmation doesn't follow the user to another one
  const [backedUpAccountAddr, setBackedUpAccountAddr] = useState<string | null>(null)

  const handleBackedUp = useCallback(
    () => setBackedUpAccountAddr(account?.addr || null),
    [account?.addr]
  )
  const handleDismissSuccess = useCallback(() => setBackedUpAccountAddr(null), [])

  if (!!backedUpAccountAddr && backedUpAccountAddr === account?.addr) {
    return (
      <Banner
        type="success"
        title={t('Your account is backed up')}
        text={t("You've successfully backed up your recovery phrase. Stay safe.")}
        onCloseIconPress={handleDismissSuccess}
      />
    )
  }

  if (!seedIdOfSelectedAccountNeedingBackup) return null

  return (
    <>
      <Banner
        type="warning"
        title={t('Phrase not backed up!')}
        text={t(
          'If your device gets lost or stolen, you will lose your wallet and all your funds.'
        )}
        buttonText={t('Back up now')}
        onPress={openBottomSheet as any}
      />
      <RecoveryPhraseBackupBottomSheet
        seedId={seedIdOfSelectedAccountNeedingBackup}
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        onBackedUp={handleBackedUp}
      />
    </>
  )
}

export default React.memo(RecoveryPhraseBackupBanner)

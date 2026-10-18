import React, { useMemo } from 'react'
import { useModalize } from 'react-native-modalize'

import Banner from '@common/components/Banner'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import RecoveryPhraseBackupBottomSheet from '@common/modules/recovery-phrase-backup/components/RecoveryPhraseBackupBottomSheet'
import useRecoveryPhraseBackupStatus from '@common/modules/recovery-phrase-backup/hooks/useRecoveryPhraseBackupStatus'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectPrivateAccountSeedId = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.privateAccount?.seedId ?? null

/**
 * Nudges the user to write down the recovery phrase of the selected account once it
 * holds funds. It cannot be dismissed - it stays until the phrase is backed up, which
 * is confirmed by a toast rather than by another banner.
 */
const RecoveryPhraseBackupBanner = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { seedIdOfSelectedAccountNeedingBackup } = useRecoveryPhraseBackupStatus()
  const { state: privateAccountSeedId } = useController(
    'SelectedAccountController',
    selectPrivateAccountSeedId
  )
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  // Neutral on the dashboard so a freshly created account isn't greeted by a coloured
  // warning. The icon and the button stay warning coloured to keep the nudge visible.
  // A Privacy Pools account keeps the warning colour: it cannot be used at all until then
  const neutralBackgroundStyle = useMemo(
    () => ({ backgroundColor: theme.secondaryBackground }),
    [theme.secondaryBackground]
  )

  if (!seedIdOfSelectedAccountNeedingBackup) return null

  return (
    <>
      <Banner
        type="warning"
        title={t('Phrase not backed up!')}
        text={
          // A Privacy Pools account is not read until its phrase is backed up
          privateAccountSeedId
            ? t(
                'Back up this recovery phrase to start using the account. It is the only way to recover it.'
              )
            : t('If your device gets lost or stolen, you will lose your wallet and all your funds.')
        }
        buttonText={t('Back up now')}
        onPress={openBottomSheet as any}
        style={privateAccountSeedId ? undefined : neutralBackgroundStyle}
      />
      <RecoveryPhraseBackupBottomSheet
        seedId={seedIdOfSelectedAccountNeedingBackup}
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
      />
    </>
  )
}

export default React.memo(RecoveryPhraseBackupBanner)

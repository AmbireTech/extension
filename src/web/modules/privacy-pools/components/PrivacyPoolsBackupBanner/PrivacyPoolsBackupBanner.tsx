import React, { useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import Banner from '@common/components/Banner'
import { useTranslation } from '@common/config/localization'
import usePrivacyPoolsAccounts from '@common/hooks/usePrivacyPoolsAccounts'
import useTheme from '@common/hooks/useTheme'
import RecoveryPhraseBackupBottomSheet from '@common/modules/recovery-phrase-backup/components/RecoveryPhraseBackupBottomSheet'
import spacings from '@common/styles/spacings'

/**
 * Asks for the recovery phrase of the selected Privacy Pools account to be written down, for as
 * long as it is not.
 *
 * Shown whether or not the account holds anything yet - unlike the regular dashboard's banner -
 * because the phrase is the only way to recover the account, and it is best written down before
 * anything is sent to it. It cannot be dismissed.
 */
const PrivacyPoolsBackupBanner = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { selectedAccount } = usePrivacyPoolsAccounts()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  const neutralBackgroundStyle = useMemo(
    () => ({ backgroundColor: theme.secondaryBackground }),
    [theme.secondaryBackground]
  )

  if (!selectedAccount || selectedAccount.isBackedUp) return null

  return (
    <View style={spacings.mbSm}>
      <Banner
        type="warning"
        title={t('Phrase not backed up!')}
        text={t(
          'This recovery phrase is the only way to recover your Privacy Pools account. Write it down before sending anything to it.'
        )}
        buttonText={t('Back up now')}
        onPress={openBottomSheet as any}
        style={neutralBackgroundStyle}
      />
      <RecoveryPhraseBackupBottomSheet
        seedId={selectedAccount.seedId}
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
      />
    </View>
  )
}

export default React.memo(PrivacyPoolsBackupBanner)

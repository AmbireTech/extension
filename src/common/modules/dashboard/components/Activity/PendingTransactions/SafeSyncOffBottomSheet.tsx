import React, { useCallback } from 'react'
import { Modalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import DualChoiceModal from '@common/components/DualChoiceModal'
import { useTranslation } from '@common/config/localization'
import useSafeApiSetting from '@common/hooks/useSafeApiSetting'
import spacings from '@common/styles/spacings'

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
}

/**
 * Explains why the pending Safe transactions can't be checked while the user has opted out of
 * the Safe API, and lets them turn it back on, which checks for them right away.
 */
const SafeSyncOffBottomSheet = ({ sheetRef, closeBottomSheet }: Props) => {
  const { t } = useTranslation()
  const { enableSafeApi } = useSafeApiSetting()

  const handleTurnOn = useCallback(() => {
    enableSafeApi()
    closeBottomSheet()
  }, [enableSafeApi, closeBottomSheet])

  return (
    <BottomSheet
      id="safe-sync-off"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      style={{ overflow: 'hidden', ...spacings.ph0, ...spacings.pv0 }}
      type="modal"
    >
      <DualChoiceModal
        title={t('Safe accounts sync is turned off')}
        description={t(
          'You turned off "Sync Safe accounts" in the privacy settings, so Ambire can\'t check for transactions and messages that the other owners or the Safe app are waiting for you to sign. Turn it on to check now.'
        )}
        primaryButtonText={t('Turn on')}
        onPrimaryButtonPress={handleTurnOn}
        secondaryButtonText={t('Not now')}
        onSecondaryButtonPress={closeBottomSheet}
        onCloseIconPress={closeBottomSheet}
      />
    </BottomSheet>
  )
}

export default React.memo(SafeSyncOffBottomSheet)

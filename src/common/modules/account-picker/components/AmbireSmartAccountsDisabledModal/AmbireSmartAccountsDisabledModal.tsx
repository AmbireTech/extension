import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import DualChoiceModal from '@common/components/DualChoiceModal'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'

const AmbireSmartAccountsDisabledModal = () => {
  const { t } = useTranslation()
  const { ref, open, close } = useModalize()
  const {
    state: { flags }
  } = useController('FeatureFlagsController')
  const { dispatch: accountPickerDispatch } = useController('AccountPickerController')

  useEffect(() => {
    if (!flags.ambireSmartAccounts) open()
  }, [flags.ambireSmartAccounts, open])

  const handleEnable = useCallback(() => {
    close()
    accountPickerDispatch({
      type: 'method',
      params: {
        method: 'enableAmbireSmartAccountsAndRescan',
        args: []
      }
    })
  }, [accountPickerDispatch, close])

  return (
    <BottomSheet
      id="ambire-smart-accounts-disabled-modal"
      sheetRef={ref}
      closeBottomSheet={close}
      type="modal"
      style={{ maxWidth: 496, ...spacings.ph0, ...spacings.pv0 }}
    >
      <DualChoiceModal
        title={t('Ambire Smart accounts are disabled')}
        description={t('Enable Ambire Smart accounts to find and manage related smart accounts.')}
        primaryButtonText={t('Enable')}
        primaryButtonTestID="enable-ambire-smart-accounts-button"
        onPrimaryButtonPress={handleEnable}
      />
    </BottomSheet>
  )
}

export default React.memo(AmbireSmartAccountsDisabledModal)

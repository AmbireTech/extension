import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import { View } from 'react-native'

import BottomSheet from '@common/components/BottomSheet'
import SheetHeaderRow from '@common/components/BottomSheet/SheetHeaderRow'
import Button from '@common/components/Button'
import DualChoiceModal from '@common/components/DualChoiceModal'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
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

  const title = t('Ambire Smart accounts are disabled')
  const description = t('Enable Ambire Smart accounts to find and manage related smart accounts.')

  // A native sheet with a full-width Enable at the bottom
  if (!isWeb) {
    return (
      <BottomSheet
        id="ambire-smart-accounts-disabled-modal"
        sheetRef={ref}
        closeBottomSheet={close}
        FooterComponent={
          <View style={spacings.ptLg}>
            <Button
              text={t('Enable')}
              testID="enable-ambire-smart-accounts-button"
              onPress={handleEnable}
              hasBottomSpacing={false}
            />
          </View>
        }
      >
        {/* Too long for the header, so the X floats alone and the title leads the content */}
        <SheetHeaderRow />
        <Text fontSize={20} weight="medium" style={spacings.mbSm}>
          {title}
        </Text>
        <Text appearance="secondaryText">{description}</Text>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet
      id="ambire-smart-accounts-disabled-modal"
      sheetRef={ref}
      closeBottomSheet={close}
      type="modal"
      style={{ maxWidth: 496, ...spacings.ph0, ...spacings.pv0 }}
    >
      <DualChoiceModal
        title={title}
        description={description}
        primaryButtonText={t('Enable')}
        primaryButtonTestID="enable-ambire-smart-accounts-button"
        onPrimaryButtonPress={handleEnable}
      />
    </BottomSheet>
  )
}

export default React.memo(AmbireSmartAccountsDisabledModal)

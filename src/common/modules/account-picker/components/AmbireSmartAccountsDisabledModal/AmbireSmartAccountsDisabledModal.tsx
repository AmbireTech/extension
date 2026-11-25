import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { View } from 'react-native'

import BottomSheet from '@common/components/BottomSheet'
import SheetHeaderRow from '@common/components/BottomSheet/SheetHeaderRow'
import useSheetRef from '@common/components/BottomSheet/useSheetRef'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'

const AmbireSmartAccountsDisabledModal = () => {
  const { t } = useTranslation()
  const { ref, open, close } = useSheetRef()
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

  // A sheet with a full-width Enable at the bottom
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

export default React.memo(AmbireSmartAccountsDisabledModal)

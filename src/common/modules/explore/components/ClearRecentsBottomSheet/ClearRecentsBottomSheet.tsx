import React, { forwardRef, useCallback, useImperativeHandle } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

export type ClearRecentsBottomSheetHandle = {
  open: () => void
  close: () => void
}

const ClearRecentsBottomSheet = forwardRef<ClearRecentsBottomSheetHandle>((_, ref) => {
  const { t } = useTranslation()
  const { ref: sheetRef, open, close } = useModalize()
  const { dispatch } = useController('DappsController')

  useImperativeHandle(ref, () => ({ open, close }), [open, close])

  const handleClear = useCallback(() => {
    dispatch({ type: 'method', params: { method: 'clearRecentDapps', args: [] } })
    close()
  }, [dispatch, close])

  const handleCancel = useCallback(() => close(), [close])

  return (
    <BottomSheet id="clear-recents" sheetRef={sheetRef} closeBottomSheet={close}>
      <View style={spacings.pv}>
        <Text weight="semiBold" fontSize={18} style={spacings.mbSm}>
          {t('Clear recent apps?')}
        </Text>
        <Text appearance="secondaryText" fontSize={14} style={spacings.mb}>
          {t(
            'This removes all apps from your Recent list. Your favorites and connections are not affected.'
          )}
        </Text>
        <View style={[flexbox.directionRow, flexbox.justifySpaceBetween]}>
          <Button
            type="secondary"
            text={t('Cancel')}
            onPress={handleCancel}
            hasBottomSpacing={false}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            type="danger"
            text={t('Clear')}
            onPress={handleClear}
            hasBottomSpacing={false}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
      </View>
    </BottomSheet>
  )
})

ClearRecentsBottomSheet.displayName = 'ClearRecentsBottomSheet'

export default ClearRecentsBottomSheet

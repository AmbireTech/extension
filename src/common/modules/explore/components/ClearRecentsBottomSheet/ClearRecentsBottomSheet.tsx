import React, { forwardRef, useCallback, useImperativeHandle } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import BottomSheet from '@common/components/BottomSheet'
import SheetHeaderRow from '@common/components/BottomSheet/SheetHeaderRow'
import useSheetRef from '@common/components/BottomSheet/useSheetRef'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

export type ClearRecentsBottomSheetHandle = {
  open: () => void
  close: () => void
}

const ClearRecentsBottomSheet = forwardRef<ClearRecentsBottomSheetHandle>((_, ref) => {
  const { t } = useTranslation()
  const { ref: sheetRef, open, close } = useSheetRef()
  const { dispatch } = useController('DappsController')

  useImperativeHandle(ref, () => ({ open, close }), [open, close])

  const handleClear = useCallback(() => {
    dispatch({ type: 'method', params: { method: 'clearRecentDapps', args: [] } })
    close()
  }, [dispatch, close])

  return (
    <BottomSheet
      id="clear-recents"
      sheetRef={sheetRef}
      closeBottomSheet={close}
      // A centered modal on web; natively a regular sheet, padded like the others
      type={isWeb ? 'modal' : undefined}
    >
      <SheetHeaderRow style={spacings.mbSm}>
        <Text weight="semiBold" fontSize={18} style={text.center}>
          {t('Clear recent apps?')}
        </Text>
      </SheetHeaderRow>
      <Text appearance="secondaryText" fontSize={14} style={spacings.mb}>
        {t(
          'This removes all apps from your Recent list. Your favorites and connections are not affected.'
        )}
      </Text>
      <View
        style={[
          flexbox.directionRow,
          flexbox.justifySpaceBetween,
          spacings.ptLg,
          { columnGap: SPACING_SM }
        ]}
      >
        <Button
          type="danger"
          text={t('Clear')}
          onPress={handleClear}
          hasBottomSpacing={false}
          style={{ flex: 1 }}
        />
      </View>
    </BottomSheet>
  )
})

ClearRecentsBottomSheet.displayName = 'ClearRecentsBottomSheet'

export default ClearRecentsBottomSheet

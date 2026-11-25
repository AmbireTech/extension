import React from 'react'
import { View } from 'react-native'

import SheetHeaderRow from '@common/components/BottomSheet/SheetHeaderRow'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'

type Props = {
  title: string
  subtitle?: string
}

/**
 * The title of a compact bottom sheet or modal, centered in the sheet's header row with its
 * X (and ‹ back), and an optional line of explanation under it.
 */
const BottomSheetTitle = ({ title, subtitle }: Props) => {
  return (
    <View style={spacings.mbLg}>
      <SheetHeaderRow style={spacings.mb0}>
        <Text fontSize={24} weight="semiBold" style={text.center}>
          {title}
        </Text>
      </SheetHeaderRow>
      {!!subtitle && (
        <Text fontSize={14} appearance="secondaryText" style={[spacings.mtMi, text.center]}>
          {subtitle}
        </Text>
      )}
    </View>
  )
}

export default React.memo(BottomSheetTitle)

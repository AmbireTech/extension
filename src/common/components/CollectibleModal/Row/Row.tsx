import { View } from 'react-native'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const NO_SHRINK_STYLE = { flexShrink: 0 }

const Row = ({ title, text, noMb }: { title: string; text: string; noMb?: boolean }) => (
  <View
    testID="collectible-row"
    style={[
      flexbox.directionRow,
      flexbox.alignCenter,
      flexbox.justifySpaceBetween,
      !noMb ? spacings.mbTy : {}
    ]}
  >
    <Text fontSize={14} appearance="primaryText" weight="medium" style={NO_SHRINK_STYLE}>
      {title}
    </Text>
    <Text
      selectable
      fontSize={14}
      appearance="secondaryText"
      // Takes only the space the title leaves, so a long value ends in "…" instead of overflowing
      style={{ textAlign: 'right', flexShrink: 1, ...spacings.mlLg }}
      numberOfLines={1}
      ellipsizeMode="tail"
      dataSet={createGlobalTooltipDataSet({
        content: text,
        id: `collectible-row-${title}`
      })}
    >
      {text}
    </Text>
  </View>
)

export default Row

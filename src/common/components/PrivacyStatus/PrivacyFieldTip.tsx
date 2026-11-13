import React, { FC } from 'react'
import { View } from 'react-native'

import BulbIcon from '@common/assets/svg/BulbIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  /** Already translated. */
  text: string
  testID?: string
}

const ICON_SIZE = 14

/**
 * A tip under a field of a send on how to keep it private, sized like `PrivacyFieldNote` so the
 * two can swap in place. Gray with a bulb, as it is advice and not a check of the value.
 */
const PrivacyFieldTip: FC<Props> = ({ text, testID }) => {
  const { theme } = useTheme()

  return (
    <View testID={testID} style={[flexbox.directionRow, flexbox.alignCenter]}>
      <BulbIcon
        width={ICON_SIZE}
        height={ICON_SIZE}
        color={theme.secondaryText}
        style={spacings.mrMi}
      />
      <Text fontSize={12} appearance="secondaryText" style={flexbox.flex1}>
        {text}
      </Text>
    </View>
  )
}

export default React.memo(PrivacyFieldTip)

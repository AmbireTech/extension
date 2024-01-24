import { FC } from 'react'
import { View } from 'react-native'

import { IS_MOBILE_UP_BENZIN_BREAKPOINT } from '@benzin/screens/BenzinScreen/styles'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

export interface StepRowProps {
  label: string
  value: string
  isValueSmall?: boolean
  error?: boolean
}

const StepRow: FC<StepRowProps> = ({ label, value, isValueSmall, error }) => (
  <View
    style={
      IS_MOBILE_UP_BENZIN_BREAKPOINT
        ? [flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween, spacings.mbTy]
        : spacings.mbTy
    }
    key={label}
  >
    <Text
      appearance={error ? 'errorText' : 'secondaryText'}
      fontSize={IS_MOBILE_UP_BENZIN_BREAKPOINT ? 14 : 12}
    >
      {label}
      {!IS_MOBILE_UP_BENZIN_BREAKPOINT && ':'}
    </Text>
    <Text
      appearance={
        error ? 'errorText' : IS_MOBILE_UP_BENZIN_BREAKPOINT ? 'secondaryText' : 'primaryText'
      }
      fontSize={!isValueSmall || !IS_MOBILE_UP_BENZIN_BREAKPOINT ? 14 : 12}
    >
      {value === 'loading' ? <Spinner style={{ width: 18, height: 18 }} /> : value}
    </Text>
  </View>
)

export default StepRow

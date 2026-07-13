import { FC, memo } from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  title: string
}
const TokenDetailsTitle: FC<Props> = ({ title }) => {
  return (
    <View style={[spacings.plSm, flexbox.justifyCenter, { height: 40 }]}>
      <Text weight="semiBold">{title}</Text>
    </View>
  )
}

export default memo(TokenDetailsTitle)

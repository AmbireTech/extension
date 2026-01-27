import React, { FC } from 'react'
import { View } from 'react-native'

import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

type InProgressProps = {
  title: string
  children: React.ReactNode
}

const InProgress: FC<InProgressProps> = ({ title, children }) => (
  <>
    <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyCenter, spacings.mbLg]}>
      <Text testID="confirming-your" fontSize={20} weight="medium" style={text.center}>
        {title}
      </Text>
      <Spinner style={{ width: 20, height: 20, ...spacings.mlSm }} />
    </View>
    {children}
  </>
)

export default InProgress

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
    <View style={[flexbox.alignCenter]}>
      <View style={[{ width: 72, height: 72 }, flexbox.center, spacings.mbSm]}>
        <Spinner style={{ width: 20, height: 20 }} />
      </View>
      <Text testID="confirming-your" fontSize={20} weight="medium" style={text.center}>
        {title}
      </Text>
    </View>
    {children}
  </>
)

export default InProgress

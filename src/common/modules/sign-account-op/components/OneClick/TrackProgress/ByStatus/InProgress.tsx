import React, { FC } from 'react'
import { View } from 'react-native'

import DotsLoadingAnimation from '@common/components/DotsLoadingAnimation'
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
    <View style={[flexbox.alignCenter, flexbox.justifyCenter, spacings.mbLg]}>
      <Text
        testID="confirming-your"
        fontSize={20}
        weight="medium"
        style={[text.center, spacings.mbSm]}
      >
        {title}
      </Text>
      <DotsLoadingAnimation />
    </View>
    {children}
  </>
)

export default InProgress

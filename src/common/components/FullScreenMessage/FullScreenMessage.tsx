import React, { ReactNode } from 'react'
import { View } from 'react-native'

import AmbireLogoHorizontal from '@common/components/AmbireLogoHorizontal'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common, { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

const CONTENT_MAX_WIDTH = 360

interface Props {
  title: string
  description: ReactNode
  /** Rendered between the description and the actions. */
  children?: ReactNode
  actions?: ReactNode
}

const FullScreenMessage = ({ title, description, children, actions }: Props) => {
  const { theme } = useTheme()

  return (
    <View style={[flexbox.flex1, flexbox.center, { backgroundColor: theme.secondaryBackground }]}>
      <View
        style={[
          spacings.pvXl,
          spacings.ph2Xl,
          flexbox.alignCenter,
          common.borderRadiusPrimary,
          {
            backgroundColor: hexToRgba(theme.primaryBackground, 0.6),
            borderColor: theme.secondaryBorder,
            borderWidth: 1
          }
        ]}
      >
        <AmbireLogoHorizontal width={124} height={43} style={spacings.mbXl} />
        <Text
          fontSize={20}
          weight="medium"
          style={[text.center, spacings.mbSm, { maxWidth: CONTENT_MAX_WIDTH }]}
        >
          {title}
        </Text>
        <View
          style={{
            maxWidth: CONTENT_MAX_WIDTH,
            ...spacings.mb,
            marginHorizontal: 'auto'
          }}
        >
          {description}
        </View>
        {children}
        {actions}
      </View>
    </View>
  )
}

export default React.memo(FullScreenMessage)

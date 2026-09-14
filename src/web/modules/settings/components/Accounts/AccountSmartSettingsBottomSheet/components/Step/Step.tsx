import React from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  number: number
  title: string
  description?: string
  /** Rendered on the right of the step, meant for its call to action */
  children?: React.ReactNode
}

const Step = ({ number, title, description, children }: Props) => {
  const { theme } = useTheme()

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbTy]}>
      <View
        style={[
          flexbox.center,
          { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.primaryBackground }
        ]}
      >
        <Text fontSize={12} weight="medium">
          {number}
        </Text>
      </View>
      <View style={[flexbox.flex1, spacings.mhTy]}>
        <Text fontSize={14} weight="medium">
          {title}
        </Text>
        {!!description && (
          <Text fontSize={12} appearance="secondaryText">
            {description}
          </Text>
        )}
      </View>
      {children}
    </View>
  )
}

export default React.memo(Step)

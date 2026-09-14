import React from 'react'
import { View } from 'react-native'

import CheckIcon2 from '@common/assets/svg/CheckIcon2'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  number: number
  title: string
  description?: string
  /** Replaces the step number with a checkmark, for a step that is already done */
  isCompleted?: boolean
  /** Rendered under the step's text, meant for its call to action */
  children?: React.ReactNode
}

const Step = ({ number, title, description, isCompleted, children }: Props) => {
  const { theme } = useTheme()

  return (
    <View style={[flexbox.directionRow, spacings.mbTy]}>
      {isCompleted ? (
        <CheckIcon2 width={22} height={22} />
      ) : (
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
      )}
      <View style={[flexbox.flex1, spacings.mhTy]}>
        <Text fontSize={14} weight="medium">
          {title}
        </Text>
        {!!description && (
          <Text fontSize={12} appearance="secondaryText">
            {description}
          </Text>
        )}
        {!!children && <View style={[flexbox.alignStart, spacings.mtTy]}>{children}</View>}
      </View>
    </View>
  )
}

export default React.memo(Step)

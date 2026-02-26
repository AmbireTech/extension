import React from 'react'
import { ViewStyle } from 'react-native'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  text: string
  renderIcon: () => React.ReactNode
  onPress: () => void
  tooltipText?: string
  testID?: string
  disabled?: boolean
  textTestID?: string
  isLoading?: boolean
  style?: ViewStyle
}

const OverviewButton = ({
  onPress,
  renderIcon,
  tooltipText,
  text,
  testID,
  textTestID,
  disabled,
  isLoading,
  style = {}
}: Props) => {
  const [bindBtnAnim, btnAnimStyle] = useHover({ preset: 'opacityInverted' })

  if (isLoading) {
    return <SkeletonLoader lowOpacity width={80} height={26} borderRadius={12} />
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      // @ts-ignore
      style={{
        ...flexbox.directionRow,
        ...flexbox.center,
        ...spacings.phSm,
        ...btnAnimStyle,
        ...(!!tooltipText && ({ cursor: 'default' } as unknown as ViewStyle)),
        borderColor: '#FFFFFF1F',
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: '#000000',
        height: 26,
        ...style
      }}
      {...bindBtnAnim}
      testID={testID}
    >
      {renderIcon()}
      <Text
        testID={textTestID}
        style={spacings.mlMi}
        dataSet={
          tooltipText
            ? createGlobalTooltipDataSet({
                id: text.toLowerCase().replace(/\s/g, '-'),
                content: tooltipText
              })
            : {}
        }
        color="#FFFFFF"
        weight="number_medium"
        fontSize={12}
      >
        {text}
      </Text>
    </AnimatedPressable>
  )
}

export default React.memo(OverviewButton)

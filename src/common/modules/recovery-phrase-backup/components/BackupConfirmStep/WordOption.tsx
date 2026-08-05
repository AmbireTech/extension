import React, { useCallback } from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  option: string
  position: number
  wordIndex: number
  isSelected: boolean
  isCorrect: boolean
  hasSeparator: boolean
  onSelect: (wordIndex: number, option: string) => void
}

const WordOption = ({
  option,
  position,
  wordIndex,
  isSelected,
  isCorrect,
  hasSeparator,
  onSelect
}: Props) => {
  const { theme } = useTheme()
  const [bindAnim, animStyle] = useHover({ preset: 'opacityInverted' })

  const handlePress = useCallback(() => onSelect(wordIndex, option), [onSelect, wordIndex, option])

  const selectedBackgroundColor = isCorrect ? theme.successBackground : theme.errorBackground
  const textAppearance = isCorrect ? 'successText' : 'errorText'

  return (
    <AnimatedPressable
      {...bindAnim}
      testID={`confirm-recovery-phrase-word-${position}-option-${option}`}
      onPress={handlePress}
      style={[
        flexbox.flex1,
        flexbox.alignCenter,
        flexbox.justifyCenter,
        spacings.pvSm,
        common.borderRadiusPrimary,
        isSelected && { backgroundColor: selectedBackgroundColor },
        animStyle
      ]}
    >
      <Text fontSize={14} weight="medium" appearance={isSelected ? textAppearance : 'primaryText'}>
        {option}
      </Text>
      {/* Drawn as a view rather than a border, so the divider cannot outlive this subtree */}
      {!!hasSeparator && (
        <View
          style={{
            position: 'absolute',
            top: '25%',
            bottom: '25%',
            right: 0,
            width: 1,
            backgroundColor: theme.secondaryBorder
          }}
        />
      )}
    </AnimatedPressable>
  )
}

export default React.memo(WordOption)

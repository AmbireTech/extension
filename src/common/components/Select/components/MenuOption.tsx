import React, { useCallback } from 'react'
import { Image, Pressable, View } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from '../styles'
import { SelectValue } from '../types'

const Option = React.memo(({ item }: { item: SelectValue }) => {
  const { styles } = useTheme(getStyles)

  // Attempt to create a dynamic testID using the label or value if they contain a string.
  // Otherwise, default to 'undefined', and letting Puppeteer to assert using alternative selectors.
  const testID = `option-${
    typeof item.label === 'string'
      ? item.label.toLowerCase().replace(/\s+/g, '-')
      : typeof item.value === 'string'
      ? item.value.toLowerCase().replace(/\s+/g, '-')
      : undefined
  }`

  if (!item) return null
  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]} testID={testID}>
      {!!item?.icon && typeof item?.icon !== 'string' && (
        <View style={spacings.mrTy}>{item.icon}</View>
      )}
      {!!item?.icon && typeof item?.icon === 'string' && (
        <Image source={{ uri: item.icon }} style={styles.optionIcon} />
      )}
      {/* The label can be a string or a React component. If it is a string, it will be rendered as a text element. */}
      {typeof item?.label === 'string' ? (
        <Text fontSize={14} numberOfLines={1}>
          {item.label}
        </Text>
      ) : (
        item?.label
      )}
    </View>
  )
})

const MenuOption = React.memo(
  ({
    item,
    height,
    isSelected,
    onPress,
    disabled
  }: {
    item: SelectValue
    height?: number
    isSelected: boolean
    onPress: (item: SelectValue) => void
    disabled?: boolean
  }) => {
    const { theme, styles } = useTheme(getStyles)

    const onPressWrapped = useCallback(() => {
      if (disabled) return

      onPress(item)
    }, [onPress, item, disabled])

    return (
      <Pressable
        style={({ hovered }: any) => [
          styles.menuOption,
          !!height && { height },
          isSelected && { backgroundColor: theme.tertiaryBackground },
          hovered && !disabled && { backgroundColor: theme.secondaryBackground },
          disabled && { opacity: 0.6, cursor: 'not-allowed' }
        ]}
        onPress={onPressWrapped}
      >
        <Option item={item} />
      </Pressable>
    )
  }
)

export { MenuOption, Option }

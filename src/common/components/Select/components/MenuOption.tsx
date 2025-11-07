import React, { useCallback } from 'react'
import { Image, Pressable, View } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from '../styles'
import { SelectProps, SelectValue } from '../types'

const formatOptionString = (optionString: string): string => {
  return optionString
    .replace(/[()]/g, '')
    .replace(/\s*,\s*/g, '-')
    .replace(/\s+/g, '-')
}

const Option = React.memo(({ item, ...rest }: { item: SelectValue }) => {
  const { styles } = useTheme(getStyles)

  // Attempt to create a dynamic testID using the label or value if they contain a string.
  // Otherwise, default to 'undefined', and letting Playwright to assert using alternative selectors.
  const testID = `option-${
    typeof item.label === 'string'
      ? formatOptionString(item.label)
      : typeof item.value === 'string'
      ? formatOptionString(item.value)
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
    index,
    height,
    isSelected,
    isHighlighted,
    onPress,
    onHoverIn,
    onHoverOut,
    disabled,
    size,
    mode
  }: {
    index: number
    item: SelectValue
    height?: number
    isSelected: boolean
    isHighlighted: boolean
    onPress: (item: SelectValue) => void
    onHoverIn: (index: number) => void
    onHoverOut: () => void
    disabled?: boolean
    size: SelectProps['size']
    mode: SelectProps['mode']
  }) => {
    const { theme, styles, themeType } = useTheme(getStyles)

    const onPressWrapped = useCallback(() => {
      if (disabled) return

      onPress(item)
    }, [onPress, item, disabled])

    const handleHoverIn = useCallback(() => {
      !!onHoverIn && onHoverIn(index)
    }, [index, onHoverIn])

    return (
      <Pressable
        style={[
          styles.menuOption,
          size && styles[`${size}MenuOption`],
          mode === 'bottomSheet' && styles.sheetMenuOption,
          !!height && { height },
          isSelected && {
            backgroundColor: themeType === THEME_TYPES.DARK ? '#FFFFFF1F' : theme.tertiaryBackground
          },
          isHighlighted &&
            !disabled && {
              backgroundColor:
                themeType === THEME_TYPES.DARK
                  ? theme.tertiaryBackground
                  : theme.secondaryBackground
            },
          // @ts-ignore
          disabled && { opacity: 0.6, cursor: 'not-allowed' }
        ]}
        onHoverIn={handleHoverIn}
        onHoverOut={onHoverOut}
        onPress={onPressWrapped}
      >
        <Option item={item} />
      </Pressable>
    )
  }
)

export { MenuOption, Option }

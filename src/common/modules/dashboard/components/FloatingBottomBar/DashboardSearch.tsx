import React, { FC, useEffect, useMemo, useRef, useState } from 'react'
import { Control, Controller } from 'react-hook-form'
import { Animated, Pressable, TextInput, View } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import SearchIcon from '@common/assets/svg/SearchIcon'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  control: Control<{ search: string }, any>
  placeholder?: string
}
const DashboardSearch: FC<Props> = ({ control, placeholder }) => {
  const { theme } = useTheme()
  const inputRef = useRef<TextInput | null>(null)
  const [isSearchFieldDisplayed, setIsSearchFieldDisplayed] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  // Keep clear button hidden until expansion finishes so it doesn't appear inside a narrow field.
  const [isSearchFullyExpanded, setIsSearchFullyExpanded] = useState(false)
  const animatedWidth = useMemo(() => new Animated.Value(40), [])

  useEffect(() => {
    setIsSearchFullyExpanded(false)

    Animated.timing(animatedWidth, {
      toValue: isSearchFieldDisplayed ? 200 : 40,
      duration: 200,
      useNativeDriver: false
    }).start(({ finished }) => {
      if (finished && isSearchFieldDisplayed) {
        setIsSearchFullyExpanded(true)
      }
    })
  }, [isSearchFieldDisplayed, animatedWidth])

  useEffect(() => {
    if (!isEditing || !isSearchFullyExpanded) return

    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [isEditing, isSearchFullyExpanded])

  return (
    <Animated.View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        isSearchFieldDisplayed && spacings.phMi,
        {
          overflow: 'visible',
          backgroundColor: isSearchFieldDisplayed ? theme.tertiaryBackground : 'transparent',
          borderRadius: 50,
          width: animatedWidth
        }
      ]}
    >
      <View style={{ width: 40, height: 40 }}>
        <Pressable
          testID="search-glass-icon"
          // Use a larger invisible touch target around the icon for easier tapping.
          hitSlop={10}
          style={{
            position: 'absolute',
            top: -8,
            left: -8,
            width: 56,
            height: 56,
            borderRadius: 28,
            ...flexbox.alignCenter,
            ...flexbox.center
          }}
          onPress={() => {
            setIsSearchFieldDisplayed((prev) => {
              if (prev) {
                setIsEditing(false)
                inputRef.current?.blur()
              } else {
                setIsEditing(true)
              }

              return !prev
            })
          }}
        >
          {({ hovered }: any) => (
            <View
              style={{
                width: 40,
                height: 40,
                backgroundColor: isSearchFieldDisplayed
                  ? theme.tertiaryBackground
                  : theme.primaryBackground,
                borderRadius: 20,
                ...flexbox.center
              }}
            >
              <SearchIcon
                width={24}
                height={24}
                color={hovered ? theme.primaryText : theme.iconPrimary}
              />
            </View>
          )}
        </Pressable>
      </View>
      {isSearchFieldDisplayed && (
        <Controller
          control={control}
          name="search"
          render={({ field: { onChange, onBlur, value } }) => {
            const showInput = isSearchFullyExpanded && (isEditing || !!value)

            const handleClose = () => {
              onChange('')
              setIsSearchFieldDisplayed(false)
              setIsEditing(false)
              inputRef.current?.blur()
            }

            return (
              <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
                {showInput ? (
                  <Input
                    testID="search-input-field"
                    borderless
                    setInputRef={(ref) => {
                      inputRef.current = ref
                    }}
                    inputWrapperStyle={{
                      height: 40,
                      paddingVertical: 0,
                      width: '100%',
                      backgroundColor: theme.tertiaryBackground
                    }}
                    inputStyle={{ height: '100%', ...spacings.plMi, ...spacings.prTy }}
                    containerStyle={{ ...flexbox.flex1, ...spacings.mb0 }}
                    nativeInputStyle={{ fontSize: 14 }}
                    onChangeText={onChange}
                    onBlur={() => {
                      onBlur()

                      if (!value) {
                        setIsEditing(false)
                        setIsSearchFieldDisplayed(false)
                      }
                    }}
                    value={value}
                  />
                ) : (
                  <Pressable
                    style={[flexbox.flex1, spacings.plMi, { height: 40 }, flexbox.justifyCenter]}
                    onPress={() => setIsEditing(true)}
                    testID="search-input-placeholder"
                  >
                    {!!placeholder && (
                      <Text appearance="secondaryText" fontSize={14} numberOfLines={1}>
                        {placeholder}
                      </Text>
                    )}
                  </Pressable>
                )}
                {isSearchFullyExpanded && (
                  <Pressable
                    style={{ width: 24, height: 24, ...flexbox.center }}
                    onPress={handleClose}
                  >
                    <CloseIcon width={12} height={12} color={theme.iconPrimary} />
                  </Pressable>
                )}
              </View>
            )
          }}
        />
      )}
    </Animated.View>
  )
}

export default DashboardSearch

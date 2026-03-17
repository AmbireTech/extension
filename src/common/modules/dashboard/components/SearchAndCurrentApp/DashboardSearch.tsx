import React, { FC, useEffect, useMemo, useState } from 'react'
import { Control, Controller } from 'react-hook-form'
import { Animated, Pressable } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import SearchIcon from '@common/assets/svg/SearchIcon'
import Input from '@common/components/Input'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  control: Control<{ search: string }, any>
}
const DashboardSearch: FC<Props> = ({ control }) => {
  const { theme } = useTheme()
  const [isSearchFieldDisplayed, setIsSearchFieldDisplayed] = useState(false)
  const animatedWidth = useMemo(() => new Animated.Value(40), [])

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: isSearchFieldDisplayed ? 200 : 40,
      duration: 200,
      useNativeDriver: false
    }).start()
  }, [isSearchFieldDisplayed, animatedWidth])

  return (
    <Animated.View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        isSearchFieldDisplayed && spacings.plMi,
        {
          overflow: 'hidden',
          backgroundColor: isSearchFieldDisplayed ? theme.tertiaryBackground : 'transparent',
          borderRadius: 50,
          width: animatedWidth
        }
      ]}
    >
      <Pressable
        style={{
          width: 40,
          height: 40,
          backgroundColor: isSearchFieldDisplayed
            ? theme.tertiaryBackground
            : theme.primaryBackground,
          borderRadius: 20,
          ...flexbox.center
        }}
        onPress={() => {
          setIsSearchFieldDisplayed((prev) => !prev)
        }}
      >
        {({ hovered }: any) => (
          <SearchIcon
            width={24}
            height={24}
            color={hovered ? theme.primaryText : theme.iconPrimary}
          />
        )}
      </Pressable>
      {isSearchFieldDisplayed && (
        <Controller
          control={control}
          name="search"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              borderless
              inputWrapperStyle={{
                height: 40,
                paddingVertical: 0,
                width: '100%',
                backgroundColor: theme.tertiaryBackground
              }}
              inputStyle={{ height: '100%', ...spacings.plMi, ...spacings.prTy }}
              containerStyle={{
                ...flexbox.flex1,
                ...spacings.mb0
              }}
              autoFocus
              placeholderTextColor={theme.secondaryText}
              nativeInputStyle={{ fontSize: 14 }}
              onChange={onChange}
              onBlur={onBlur}
              buttonStyle={spacings.ph0}
              value={value}
              button={
                <Pressable
                  style={{
                    width: 24,
                    height: 24,
                    ...flexbox.center
                  }}
                  onPress={() => {
                    onChange('')
                    setIsSearchFieldDisplayed(false)
                  }}
                >
                  <CloseIcon width={12} height={12} color={theme.iconPrimary} />
                </Pressable>
              }
            />
          )}
        />
      )}
    </Animated.View>
  )
}

export default DashboardSearch

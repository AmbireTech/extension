import React from 'react'
import { Control, Controller } from 'react-hook-form'
import { View, ViewStyle } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import SearchIcon from '@common/assets/svg/SearchIcon'
import Input, { InputProps } from '@common/components/Input'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

interface Props extends InputProps {
  placeholder?: string
  style?: ViewStyle
  containerStyle?: ViewStyle
  inputWrapperStyle?: ViewStyle
  control: Control<{ search: string }, any>
  height?: number
  hasLeftIcon?: boolean
  onSearchCleared?: () => void
}

const Search = ({
  placeholder = 'Search',
  style,
  control,
  containerStyle = {},
  inputWrapperStyle = {},
  height = 40,
  hasLeftIcon = true,
  onSearchCleared,
  ...rest
}: Props) => {
  const { theme } = useTheme()
  // Scale the clear search icon size based on the height of the search input
  const clearSearchIconSize = Math.min(Math.floor(height / 2.5), 12)

  return (
    <Controller
      control={control}
      name="search"
      render={({ field: { onChange, onBlur, value } }) => (
        <Input
          containerStyle={[spacings.mb0 as ViewStyle, containerStyle]}
          leftIcon={hasLeftIcon ? () => <SearchIcon color={theme.secondaryText} /> : undefined}
          placeholder={placeholder}
          style={style}
          inputWrapperStyle={[{ height }, inputWrapperStyle]}
          inputStyle={{ height: height - 2 }}
          placeholderTextColor={theme.secondaryText}
          onBlur={onBlur}
          onChange={onChange}
          value={value}
          button={
            // A trick to prevent layout shift when the clear search icon appears
            <View
              style={{
                width: clearSearchIconSize,
                height: clearSearchIconSize
              }}
            >
              {!!value && <CloseIcon width={clearSearchIconSize} height={clearSearchIconSize} />}
            </View>
          }
          buttonStyle={{
            ...spacings.pv0,
            ...spacings.ph0,
            ...spacings.mrSm
          }}
          onButtonPress={() => {
            if (!value) return
            onChange('')
            if (onSearchCleared) onSearchCleared()
          }}
          testID="search-input"
          {...rest}
        />
      )}
    />
  )
}

export default React.memo(Search)

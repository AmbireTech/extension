import React from 'react'
import { Control, Controller, UseFormSetValue } from 'react-hook-form'
import { ViewStyle } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import SearchIcon from '@common/assets/svg/SearchIcon'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import Input from '../Input'

type Props = {
  placeholder?: string
  style?: ViewStyle
  containerStyle?: ViewStyle
  control: Control<{ search: string }, any>
  setValue?: UseFormSetValue<{ search: string }>
  height?: number
}

const Search = ({
  placeholder = 'Search',
  style,
  control,
  setValue,
  containerStyle = {},
  height = 40
}: Props) => {
  const { theme } = useTheme()

  return (
    <Controller
      control={control}
      name="search"
      render={({ field: { onChange, onBlur, value } }) => (
        <Input
          containerStyle={[spacings.mb0, containerStyle]}
          leftIcon={() => <SearchIcon color={theme.secondaryText} />}
          placeholder={placeholder}
          style={style}
          inputWrapperStyle={{ height }}
          inputStyle={{ height }}
          placeholderTextColor={theme.secondaryText}
          onBlur={onBlur}
          onChange={onChange}
          value={value}
          {...(setValue && value.length
            ? {
                button: <CloseIcon width={12} height={12} strokeWidth="2" />,
                buttonStyle: spacings.mrTy,
                onButtonPress: () => setValue('search', '')
              }
            : {})}
        />
      )}
    />
  )
}

export default React.memo(Search)

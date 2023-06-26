import React, { useState } from 'react'
import { TouchableOpacity } from 'react-native'
import Select, { components, DropdownIndicatorProps } from 'react-select'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import colors from '@common/styles/colors'

interface Props {
  value: string | null
  options: any[]
  setValue?: (value: any) => void
  label?: string
  disabled?: boolean
}

const SelectComponent = ({ value, disabled, setValue, options, label }: Props) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const DropdownIndicator = (props: DropdownIndicatorProps<any>) => {
    return (
      <components.DropdownIndicator {...props}>
        {isDropdownOpen ? (
          <UpArrowIcon width={34} height={34} />
        ) : (
          <DownArrowIcon width={34} height={34} />
        )}
      </components.DropdownIndicator>
    )
  }
  return (
    <TouchableOpacity onPress={() => setIsDropdownOpen(!isDropdownOpen)} disabled={disabled}>
      <Select
        options={options}
        components={{ DropdownIndicator }}
        styles={{
          placeholder: (baseStyles) => ({
            ...baseStyles,
            borderRadius: 12,
            fontSize: 14,
            color: colors.martinique
          }),
          control: (baseStyles) => ({
            ...baseStyles,
            width: 260,
            background: colors.melrose_15,
            borderRadius: 12,
            fontSize: 14,
            color: colors.martinique
          }),
          option: (baseStyles) => ({
            ...baseStyles,
            fontSize: 14,
            cursor: 'pointer',
            color: colors.martinique
          })
        }}
        theme={(theme) => ({
          ...theme,
          borderRadius: 0,
          colors: {
            ...theme.colors,
            primary25: colors.melrose_15,
            primary: colors.melrose
          }
        })}
        placeholder={label}
        menuPlacement="auto"
      />
    </TouchableOpacity>
  )
}

export default React.memo(SelectComponent)

import './styles.css'

import React from 'react'

import Text from '@common/components/Text'
import colors from '@common/styles/colors'

import { ToggleProps } from './types'

const Toggle: React.FC<ToggleProps> = ({ id, isOn, onToggle, label }) => {
  const handleOnToggle: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    onToggle(e.target.checked)
  }

  return (
    <label className="toggle" htmlFor={id}>
      <input
        className="toggle__input"
        type="checkbox"
        checked={isOn}
        id={id}
        onChange={handleOnToggle}
      />
      <div className="toggle__fill" />
      <Text fontSize={18} weight="regular" color={colors.martinique}>
        {label}
      </Text>
    </label>
  )
}

export default Toggle

import './styles.css'

import React from 'react'

import Text, { Props as TextProps } from '@common/components/Text'

import { ToggleProps } from './types'

interface Props extends ToggleProps {
  labelProps?: TextProps
}

const Toggle: React.FC<Props> = ({ id, isOn, onToggle, label, labelProps }) => {
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
      <Text fontSize={12} weight="medium" {...labelProps}>
        {label}
      </Text>
    </label>
  )
}

export default Toggle

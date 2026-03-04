import React from 'react'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import { hexToRgba } from '@common/styles/utils/common'

import { ToggleProps } from './types'

const Toggle: React.FC<ToggleProps> = ({
  id,
  isOn,
  onToggle,
  label,
  labelProps,
  toggleStyle,
  trackStyle,
  children,
  disabled,
  testID
}) => {
  const { theme, themeType } = useTheme()
  const handleOnToggle: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    onToggle(e.target.checked)
  }

  return (
    <label
      htmlFor={id}
      // @ts-ignore it exists for the React Native Web component
      testID={testID}
      style={{
        alignItems: 'center',
        display: 'flex',
        cursor: 'pointer',
        flexShrink: 0,
        opacity: disabled ? 0.4 : 1
      }}
    >
      <input
        style={{ display: 'none' }}
        type="checkbox"
        checked={isOn}
        id={id}
        onChange={handleOnToggle}
        disabled={disabled}
      />
      <div
        style={{
          marginRight: '12px',
          display: 'inline-block',
          position: 'relative',
          width: '28px',
          height: '12px',
          borderRadius: '13px',
          transition: 'border 0.2s',
          background: hexToRgba(String(isOn ? theme.success400 : theme.neutral600)),
          ...(trackStyle as React.CSSProperties)
        }}
      >
        <div
          style={{
            content: '',
            position: 'absolute',
            boxSizing: 'border-box',
            height: '16px',
            top: '-2px',
            width: '16px',
            borderRadius: '13px',
            transition: 'transform 0.2s',
            background: String(theme.neutral300),
            border: 'transparent',
            transform: isOn ? 'translateX(12px)' : '',
            boxShadow: '0px 2px 2px 0px #00000040',
            ...(toggleStyle as React.CSSProperties)
          }}
        />
        {children}
      </div>
      <Text fontSize={12} weight="medium" {...labelProps}>
        {label}
      </Text>
    </label>
  )
}

export default React.memo(Toggle)

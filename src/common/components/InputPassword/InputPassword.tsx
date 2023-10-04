import React, { useState } from 'react'

import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import VisibilityIcon from '@common/assets/svg/VisibilityIcon'
import Input, { InputProps } from '@common/components/Input'
import useTheme from '@common/hooks/useTheme'

interface Props extends InputProps {}

const InputPassword: React.FC<Props> = ({ onChangeText, ...rest }) => {
  const { theme } = useTheme()
  const [secureTextEntry, setSecureTextEntry] = useState(true)

  const handleToggleSecureTextEntry = () => setSecureTextEntry(!secureTextEntry)

  return (
    <Input
      secureTextEntry={secureTextEntry}
      autoCorrect={false}
      button={
        secureTextEntry ? (
          <VisibilityIcon color={theme.inputIcon} />
        ) : (
          <InvisibilityIcon color={theme.inputIcon} />
        )
      }
      onButtonPress={handleToggleSecureTextEntry}
      onChangeText={onChangeText}
      {...rest}
    />
  )
}

export default React.memo(InputPassword)

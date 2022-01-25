import React, { useState } from 'react'

import { useTranslation } from '@config/localization'
import CodeInput from '@modules/common/components/CodeInput'
import P from '@modules/common/components/P'
import { TEXT_TYPES } from '@modules/common/components/Text'
import Title from '@modules/common/components/Title'
import Wrapper from '@modules/common/components/Wrapper'
import usePasscode from '@modules/common/hooks/usePasscode'
import { useNavigation } from '@react-navigation/native'

interface Props {
  passcode: string
}

const ValidatePasscodeScreen: React.FC<Props> = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const { isValidPasscode } = usePasscode()
  const [hasValidPasscode, setHasValidPasscode] = useState<null | boolean>(null)

  const handleOnValidate = (code: string) => {
    const isValid = isValidPasscode(code)
    setHasValidPasscode(isValid)

    if (isValid) {
      navigation.navigate('passcode-change')
    }
  }

  const hasError = !hasValidPasscode && hasValidPasscode !== null

  return (
    <Wrapper>
      <Title>{t('Current passcode')}</Title>
      <P>{t('In order to change or remove passcode, enter the current passcode first.')}</P>
      {hasError && <P type={TEXT_TYPES.DANGER}>{t('Wrong passcode.')}</P>}
      <CodeInput onFulfill={handleOnValidate} />
    </Wrapper>
  )
}

export default ValidatePasscodeScreen

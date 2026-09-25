import React from 'react'
import { ViewStyle } from 'react-native'
import { SvgProps } from 'react-native-svg'

import Button from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

type Props = {
  BiometricsIcon: React.FC<SvgProps>
  isVerifying: boolean
  onPress: () => void
  /** The wording, e.g. "Unlock with biometrics". */
  text?: string
  style?: ViewStyle
}

/** The way back to biometrics, offered underneath a password field. */
const SwitchToBiometricsButton = ({ BiometricsIcon, isVerifying, onPress, text, style }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <Button
      testID="switch-to-biometrics-button"
      text={text || t('Confirm with biometrics')}
      type="secondary"
      size="large"
      hasBottomSpacing={false}
      disabled={isVerifying}
      onPress={onPress}
      childrenPosition="left"
      style={[spacings.mtSm, style]}
    >
      <BiometricsIcon width={24} height={24} color={theme.primaryText} style={spacings.mrTy} />
    </Button>
  )
}

export default React.memo(SwitchToBiometricsButton)

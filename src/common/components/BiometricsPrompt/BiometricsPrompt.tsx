import React from 'react'
import { Pressable, View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

const BIOMETRICS_BUTTON_SIZE = 80

type Props = {
  BiometricsIcon: React.FC<SvgProps>
  isVerifying: boolean
  errorMessage?: string
  onConfirm: () => void
  onSwitchToPassword: () => void
  /** The wording of the way out, e.g. "Unlock with password". */
  switchToPasswordText?: string
  /**
   * Spreads over the height it is given instead of stacking at the top: the icon sits in the
   * middle of what is left and the way out goes to the bottom. For the taller modals, where
   * stacking leaves the whole lower half empty.
   */
  fillHeight?: boolean
}

/**
 * Asking for biometrics, wherever the app asks the user to prove who they are. The way out to
 * the password is always here, because the prompt can be unavailable or keep failing.
 */
const BiometricsPrompt = ({
  BiometricsIcon,
  isVerifying,
  errorMessage,
  onConfirm,
  onSwitchToPassword,
  switchToPasswordText,
  fillHeight
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <View style={[flexbox.alignCenter, !!fillHeight && flexbox.flex1]}>
      <View
        style={[
          flexbox.alignCenter,
          !!fillHeight && flexbox.flex1,
          !!fillHeight && flexbox.justifyCenter
        ]}
      >
        <Pressable
          testID="biometrics-prompt-button"
          onPress={onConfirm}
          disabled={isVerifying}
          style={{
            width: BIOMETRICS_BUTTON_SIZE,
            height: BIOMETRICS_BUTTON_SIZE,
            borderRadius: BIOMETRICS_BUTTON_SIZE / 2,
            backgroundColor: theme.secondaryBackground,
            ...flexbox.center,
            ...spacings.mbLg
          }}
        >
          <BiometricsIcon width={56} height={56} color={theme.iconPrimary} />
        </Pressable>
        {!!errorMessage && (
          <Text fontSize={12} appearance="errorText" style={[text.center, spacings.mbSm]}>
            {errorMessage}
          </Text>
        )}
      </View>
      <Button
        testID="biometrics-prompt-use-password-button"
        text={switchToPasswordText || t('Confirm with password')}
        type="secondary"
        size="large"
        hasBottomSpacing={false}
        disabled={isVerifying}
        onPress={onSwitchToPassword}
        style={common.fullWidth}
      />
    </View>
  )
}

export default React.memo(BiometricsPrompt)

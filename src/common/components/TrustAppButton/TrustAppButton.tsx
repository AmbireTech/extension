import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import CheckIcon from '@common/assets/svg/CheckIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  onPress: () => void
  /**
   * Lets a screen that scales its whole content down scale the label with it. Defaults to 12px.
   */
  fontSize?: number
  style?: ViewStyle
}

const BUTTON_STYLE: ViewStyle = {
  ...spacings.ph0,
  // The ghost button's inner container adds horizontal padding of its own for the hover highlight,
  // so pull the button back by it: the label then lines up with the badge slot the button sits in,
  // while the highlight stays free to bleed into the container's padding.
  marginRight: -SPACING_TY
}

// The ghost inner container is a fixed 32px tall, which leaves the label floating well below the
// heading next to it. Let the box hug its content instead - it keeps the container's own vertical
// padding, so the hover highlight still has room to breathe, and lands close to the `sm` Badge
// this button stands in for. Both rows it sits in center their children, so the label lines up.
const getInnerContainerStyle = (): ViewStyle => ({ height: 'auto' })

/**
 * Silences the suspicious app hosting warning for an app the user vouches for. Styled as a
 * borderless inline action (like the "Advanced" network fee action) rather than a filled button:
 * it has to read as a control, but it shouldn't invite a click on a warning the user may not have
 * read yet.
 */
const TrustAppButton = ({ onPress, fontSize = 12, style }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <Button
      type="ghost"
      size="tiny"
      onPress={onPress}
      hasBottomSpacing={false}
      shouldScaleChildrenOnHover={false}
      innerContainerStyle={getInnerContainerStyle}
      testID="trust-dapp-button"
      style={[BUTTON_STYLE, style]}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <CheckIcon width={16} height={16} color={theme.warningDecorative} />
        <Text
          fontSize={fontSize}
          weight="medium"
          color={theme.warningDecorative}
          style={spacings.mlTy}
        >
          {t('Trust this app')}
        </Text>
      </View>
    </Button>
  )
}

export default React.memo(TrustAppButton)

import React, { ReactNode } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

type Props = {
  icon: ReactNode
  title: string
  description: string
  buttonText?: string
  onButtonPress?: () => void
  /** Keeps the content in the upper third of the panel instead of its center */
  isInUpperThird?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * A message filling the side panel in place of the wallet (e.g. no accounts, side panel mode off,
 * sidebar too narrow): an icon, a title, a description and an optional button.
 */
const SidePanelEmptyState = ({
  icon,
  title,
  description,
  buttonText,
  onButtonPress,
  isInUpperThird,
  style
}: Props) => (
  <View
    style={[
      flexbox.flex1,
      flexbox.alignCenter,
      !isInUpperThird && flexbox.justifyCenter,
      spacings.ph,
      style
    ]}
  >
    {isInUpperThird && <View style={{ flex: 0.22 }} />}
    {icon}
    <Text fontSize={20} weight="medium" style={[spacings.mtMd, text.center]}>
      {title}
    </Text>
    <Text
      fontSize={16}
      weight="regular"
      appearance="secondaryText"
      style={[spacings.mtTy, text.center]}
    >
      {description}
    </Text>
    {!!buttonText && (
      <Button
        type="primary"
        text={buttonText}
        onPress={onButtonPress}
        hasBottomSpacing={false}
        style={[spacings.mtLg, flexbox.alignSelfCenter, { minWidth: 180 }]}
      />
    )}
    {isInUpperThird && <View style={{ flex: 0.78 }} />}
  </View>
)

export default React.memo(SidePanelEmptyState)

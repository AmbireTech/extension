import React, { FC, ReactNode } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'
import { SvgProps } from 'react-native-svg'

import CloseIcon from '@common/assets/svg/CloseIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import getStyles from './styles'

export interface Props {
  title?: string | ReactNode
  description: string | ReactNode
  Icon?: React.FC<SvgProps>
  onPrimaryButtonPress: () => void
  onSecondaryButtonPress?: () => void
  onCloseIconPress?: () => void
  primaryButtonText: string
  secondaryButtonText?: string
  primaryButtonTestID?: string
  secondaryButtonTestID?: string
  buttonsContainerStyle?: ViewStyle
  hideHeader?: boolean
  style?: ViewStyle
}

const DualChoiceModal: FC<Props> = ({
  title,
  description,
  Icon,
  onSecondaryButtonPress,
  onPrimaryButtonPress,
  onCloseIconPress,
  primaryButtonText,
  secondaryButtonText,
  secondaryButtonTestID,
  primaryButtonTestID,
  buttonsContainerStyle,
  hideHeader,
  style
}) => {
  const { styles, theme } = useTheme(getStyles)

  return (
    <View>
      {!hideHeader && (
        <View style={styles.modalHeader}>
          <Text weight="medium" fontSize={20}>
            {title}
          </Text>
          {!!onCloseIconPress && (
            <Pressable onPress={onCloseIconPress}>
              <CloseIcon />
            </Pressable>
          )}
        </View>
      )}
      <View style={[styles.modalInnerContainer, style]}>
        {!!Icon && (
          <View>
            <Icon style={spacings.mrLg} color={theme.iconPrimary} />
          </View>
        )}
        <Text appearance="secondaryText">{description}</Text>
      </View>
      <View style={[styles.modalButtonsContainer, buttonsContainerStyle]}>
        {!!secondaryButtonText && !!onSecondaryButtonPress && (
          <Button
            text={secondaryButtonText}
            onPress={onSecondaryButtonPress}
            type="secondary"
            hasBottomSpacing={false}
            size="large"
            style={[styles.button, spacings.mr]}
            testID={secondaryButtonTestID}
          />
        )}
        <Button
          text={primaryButtonText}
          onPress={onPrimaryButtonPress}
          hasBottomSpacing={false}
          size="large"
          style={styles.button}
          testID={primaryButtonTestID}
        />
      </View>
    </View>
  )
}

export default React.memo(DualChoiceModal)

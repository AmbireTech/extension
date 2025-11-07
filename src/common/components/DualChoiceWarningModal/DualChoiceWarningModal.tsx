import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import ErrorIcon from '@common/assets/svg/ErrorIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Button, { Props as ButtonProps } from '@common/components/Button'
import { Props as DualChoiceModalProps } from '@common/components/DualChoiceModal/DualChoiceModal'
import CommonText, { Props } from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type Type = 'error' | 'warning' | 'info3'

const DEFAULT_TYPE = 'warning'

const Wrapper: FC<{ children: React.ReactNode | React.ReactNode[] }> = ({ children }) => {
  const { styles } = useTheme(getStyles)

  return <View style={styles.container}>{children}</View>
}

const TitleAndIcon = ({
  title,
  style,
  type = DEFAULT_TYPE
}: {
  title: string
  type?: Type
  style?: ViewStyle
}) => {
  const { styles, theme } = useTheme(getStyles)
  const Icon = type === 'error' ? ErrorIcon : type === 'info3' ? InfoIcon : WarningIcon

  return (
    <View style={[styles.titleAndIcon, style]}>
      <View style={spacings.mbTy}>
        <Icon width={32} height={32} color={theme[`${type}Decorative`]} />
      </View>
      <CommonText appearance={`${type}Text`} weight="medium" fontSize={20}>
        {title}
      </CommonText>
    </View>
  )
}

const Text = ({ text, ...rest }: { text: string } & Props) => {
  return (
    <CommonText fontSize={16} appearance="secondaryText" {...rest}>
      {text}
    </CommonText>
  )
}

const ContentWrapper = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => {
  const { styles } = useTheme(getStyles)

  return <View style={[styles.content, style]}>{children}</View>
}

const ButtonWrapper = ({
  children,
  reverse = false
}: {
  children: React.ReactNode
  reverse: boolean
}) => {
  const { styles } = useTheme(getStyles)

  return <View style={[styles.buttons, reverse && flexbox.directionRowReverse]}>{children}</View>
}

const DualChoiceWarningModal = ({
  title,
  description,
  onSecondaryButtonPress,
  onPrimaryButtonPress,
  primaryButtonText,
  children,
  secondaryButtonText,
  primaryButtonProps,
  secondaryButtonProps,
  type = DEFAULT_TYPE
}: Omit<DualChoiceModalProps, 'description' | 'primaryButtonTestID' | 'secondaryButtonTestID'> & {
  title: string
  description?: string
  children?: React.ReactNode | React.ReactNode[]
  primaryButtonProps?: ButtonProps
  secondaryButtonProps?: ButtonProps
  type?: Type
}) => {
  const { theme } = useTheme()

  return (
    <Wrapper>
      <ContentWrapper style={{ backgroundColor: theme[`${type}Background`] }}>
        <TitleAndIcon type={type} title={title} />
        {!!description && <Text text={description} />}
        {children}
      </ContentWrapper>
      <ButtonWrapper reverse={type === 'info3'}>
        <Button
          text={primaryButtonText}
          onPress={onPrimaryButtonPress}
          type={type}
          hasBottomSpacing={false}
          style={spacings.ph2Xl}
          {...primaryButtonProps}
        />
        {secondaryButtonText && onSecondaryButtonPress && (
          <Button
            text={secondaryButtonText}
            onPress={onSecondaryButtonPress}
            type="outline"
            hasBottomSpacing={false}
            style={spacings.phXl}
            accentColor={theme.secondaryText}
            {...secondaryButtonProps}
          />
        )}
      </ButtonWrapper>
    </Wrapper>
  )
}

DualChoiceWarningModal.Wrapper = Wrapper
DualChoiceWarningModal.TitleAndIcon = TitleAndIcon
DualChoiceWarningModal.Text = Text
DualChoiceWarningModal.ContentWrapper = ContentWrapper
DualChoiceWarningModal.ButtonWrapper = ButtonWrapper

export default DualChoiceWarningModal

import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import ErrorIcon from '@common/assets/svg/ErrorIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Button, { Props as ButtonProps } from '@common/components/Button'
import { Props as DualChoiceModalProps } from '@common/components/DualChoiceModal/DualChoiceModal'
import CommonText, { Props } from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import GlassView from '../GlassView'
import getStyles from './styles'

type Type = 'error' | 'warning'

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
  const Icon = type === 'error' ? ErrorIcon : WarningIcon

  return (
    <View style={[styles.titleAndIcon, style]}>
      <View style={spacings.mrTy}>
        <Icon width={24} height={24} color={theme[`${type}Text`]} />
      </View>
      <CommonText appearance={`${type}Text`} weight="semiBold">
        {title}
      </CommonText>
    </View>
  )
}

const Text = ({ text, type, ...rest }: { text: string; type?: Type } & Omit<Props, 'type'>) => {
  const { theme } = useTheme()

  return (
    <CommonText
      fontSize={16}
      color={theme[`${type || 'secondary'}Text`]}
      style={spacings.mb3Xl}
      {...rest}
    >
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

  return (
    <View style={[flexbox.directionRow, flexbox.justifyCenter]}>
      <GlassView style={{ borderRadius: 28 }} cssStyle={{ borderRadius: 28 }}>
        <View style={[styles.buttons, reverse && flexbox.directionRowReverse]}>{children}</View>
      </GlassView>
    </View>
  )
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
      <ContentWrapper>
        <TitleAndIcon type={type} title={title} />
        {!!description && <Text text={description} type={type} />}
        {children}
      </ContentWrapper>
      <ButtonWrapper reverse={false}>
        <Button
          text={primaryButtonText}
          onPress={onPrimaryButtonPress}
          type={type}
          hasBottomSpacing={false}
          size="smaller"
          {...primaryButtonProps}
        />
        {secondaryButtonText && onSecondaryButtonPress && (
          <Button
            text={secondaryButtonText}
            onPress={onSecondaryButtonPress}
            type="secondary"
            hasBottomSpacing={false}
            accentColor={theme.secondaryText}
            size="smaller"
            {...secondaryButtonProps}
            style={[spacings.mlLg, secondaryButtonProps?.style as ViewStyle | undefined]}
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

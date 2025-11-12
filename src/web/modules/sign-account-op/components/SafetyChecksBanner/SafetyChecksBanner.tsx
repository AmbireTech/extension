import React from 'react'
import { View, ViewStyle } from 'react-native'

import ErrorIcon from '@common/assets/svg/ErrorIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  title: string
  text: string | React.ReactNode
  type: 'error' | 'warning'
  style?: ViewStyle
  testID?: string
}

const ICON_MAP = {
  error: ErrorIcon,
  warning: WarningIcon
}

const Alert = ({ title, text, type, style, testID }: Props) => {
  const Icon = ICON_MAP[type]
  const { theme } = useTheme()

  return (
    <View
      style={[
        spacings.phSm,
        spacings.pvSm,
        flexbox.directionRow,
        common.borderRadiusPrimary,
        {
          backgroundColor: theme[`${type}Background`]
        },
        style
      ]}
      testID={testID}
    >
      <Icon width={20} height={20} color={theme[`${type}Decorative`]} />

      <View style={flexbox.flex1}>
        {!!title && (
          <Text style={text ? (!isSmall ? spacings.mbTy : spacings.mbMi) : {}}>
            {!isTypeLabelHidden && (
              <Text
                selectable
                appearance={`${type}Text`}
                fontSize={fontSize}
                weight={titleWeight || 'semiBold'}
                style={{ textTransform: 'capitalize' }}
              >
                {type}:{' '}
              </Text>
            )}
            <Text
              selectable
              appearance={`${type}Text`}
              fontSize={fontSize}
              weight={titleWeight || 'semiBold'}
            >
              {title}
            </Text>
          </Text>
        )}
        {!!text &&
          (typeof text === 'string' ? (
            <AlertText size={size} type={type}>
              {text}
            </AlertText>
          ) : (
            text
          ))}
        {buttonProps && (
          <Button
            style={{
              alignSelf: 'flex-end',
              ...spacings.mtTy
            }}
            textStyle={type === 'error' && { fontSize: 14 }}
            size="small"
            type="primary"
            hasBottomSpacing={false}
            text={buttonProps.text}
            onPress={buttonProps.onPress}
            {...buttonProps}
          />
        )}
        {children}
      </View>
    </View>
  )
}

export default Alert

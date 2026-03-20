import React, { ReactNode } from 'react'
import { Pressable, TextStyle, View, ViewProps, ViewStyle } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { WindowSizes } from '@common/hooks/useWindowSize/types'
import spacings, { SPACING_3XL, SPACING_LG, SPACING_XL } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import getStyles from './styles'

export interface PanelProps extends ViewProps {
  type?: 'default' | 'onboarding'
  title?: string | ReactNode
  spacingsSize?: 'small' | 'large'
  withBackButton?: boolean
  onBackButtonPress?: () => void
  step?: number
  totalSteps?: number
  panelWidth?: number
  panelRef?: React.MutableRefObject<any>
  innerStyle?: ViewStyle
}

export const getPanelPaddings = (
  maxWidthSize: (size: WindowSizes) => boolean,
  spacingsSize: 'small' | 'large' = 'large'
) => {
  return {
    paddingHorizontal: maxWidthSize('xl') && spacingsSize === 'large' ? SPACING_3XL : SPACING_LG,
    paddingVertical: maxWidthSize('xl') && spacingsSize === 'large' ? SPACING_XL : SPACING_LG
  }
}

const PanelBackButton = ({ onPress, style }: { onPress: () => void; style?: ViewStyle }) => {
  const { styles, theme } = useTheme(getStyles)
  return (
    <Pressable testID="panel-back-btn" onPress={onPress} style={style}>
      {({ hovered }: any) => (
        <View style={[styles.backBtnWrapper]}>
          <LeftArrowIcon color={hovered ? theme.primaryText : theme.iconPrimary} />
        </View>
      )}
    </Pressable>
  )
}

const PanelTitle = ({
  title,
  size,
  style
}: {
  title: string | ReactNode
  size?: number
  style?: TextStyle
}) => {
  return (
    <Text
      fontSize={size || 20}
      weight="medium"
      numberOfLines={1}
      style={[text.center, flexbox.flex1, style]}
    >
      {title}
    </Text>
  )
}

const Panel: React.FC<PanelProps> = ({
  type = 'default',
  title,
  children,
  style,
  spacingsSize = 'large',
  withBackButton,
  onBackButtonPress = () => {},
  step = 0,
  totalSteps = 2,
  panelWidth = 400,
  panelRef,
  innerStyle,
  ...rest
}) => {
  const { styles, theme } = useTheme(getStyles)
  const { maxWidthSize, minHeightSize } = useWindowSize()

  const renderProgress = () => (
    <View style={[flexbox.directionRow, { position: 'absolute', top: 0, width: '100%' }]}>
      {[...Array(totalSteps)].map((_, index) => (
        <View
          key={`step-${index.toString()}`}
          style={[
            styles.progress,
            index > 0 ? spacings.mlMi : undefined,
            {
              backgroundColor: index < step ? theme.successDecorative : theme.tertiaryBackground
            }
          ]}
        />
      ))}
    </View>
  )

  if (type === 'onboarding') {
    return (
      <View
        ref={panelRef}
        style={[
          styles.onboardingContainer,
          {
            width: '100%',
            minHeight: minHeightSize(620) ? 520 : 560,
            maxWidth: panelWidth,
            alignSelf: 'center',
            maxHeight: minHeightSize('l') ? '95%' : '92%'
          },
          style
        ]}
      >
        {step > 0 && renderProgress()}
        <View
          style={[
            styles.innerContainer,
            getPanelPaddings(maxWidthSize, spacingsSize),
            {
              width: '100%',
              maxWidth: panelWidth,
              alignSelf: 'center'
            },
            innerStyle
          ]}
          {...rest}
        >
          {(!!title || !!withBackButton) && (
            <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mb2Xl]}>
              {!!withBackButton && <PanelBackButton onPress={onBackButtonPress} />}
              {!!title && <PanelTitle title={title} />}
              {!!withBackButton && <View style={{ width: 20 }} />}
            </View>
          )}
          {children}
        </View>
      </View>
    )
  }

  return (
    <View
      ref={panelRef}
      style={[styles.container, getPanelPaddings(maxWidthSize, spacingsSize), style]}
      {...rest}
    >
      {!!title && (
        <Text
          fontSize={maxWidthSize('xl') ? 20 : 18}
          weight="medium"
          appearance="primaryText"
          style={maxWidthSize('xl') ? spacings.mbXl : spacings.mbMd}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  )
}

export { PanelBackButton, PanelTitle }

export default React.memo(Panel)

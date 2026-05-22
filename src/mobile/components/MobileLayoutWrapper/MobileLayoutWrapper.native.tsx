import React from 'react'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useIsInsideBottomSheet } from '@common/components/BottomSheet/BottomSheetContext'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import {
  MobileLayoutContainerProps,
  MobileLayoutWrapperMainContentProps
} from './MobileLayoutWrapper'
import getStyles from './styles'

const MobileLayoutContainer: React.FC<MobileLayoutContainerProps> = ({
  backgroundColor,
  header,
  footer,
  footerStyle,
  children,
  renderDirectChildren,
  style,
  withHorizontalPadding = false,
  withTopPadding = true
}) => {
  const { theme } = useTheme(getStyles)
  const insets = useSafeAreaInsets()
  const isInsideBottomSheet = useIsInsideBottomSheet()

  const paddingTop = isInsideBottomSheet ? 0 : insets.top + (withTopPadding ? SPACING_SM : 0)

  return (
    <View
      style={[
        flexbox.flex1,
        {
          backgroundColor: backgroundColor || theme.primaryBackground,
          paddingTop
        }
      ]}
    >
      {!!header && <View style={[spacings.phSm, spacings.mbSm]}>{header}</View>}
      <View style={[flexbox.flex1, withHorizontalPadding ? spacings.phSm : undefined]}>
        <View
          style={[
            flexbox.flex1,
            {
              backgroundColor: backgroundColor || theme.primaryBackground,
              width: '100%'
            },
            style
          ]}
        >
          {children}
        </View>
      </View>
      {!!footer && (
        <View
          style={[
            { paddingBottom: insets.bottom || SPACING_SM },
            spacings.ptSm,
            spacings.phSm,
            footerStyle
          ]}
        >
          {footer}
        </View>
      )}
      {!!renderDirectChildren && renderDirectChildren()}
    </View>
  )
}

const MobileLayoutWrapperMainContent: React.FC<MobileLayoutWrapperMainContentProps> = ({
  children,
  wrapperRef,
  contentContainerStyle = {},
  withScroll = false,
  keyboardAwareScrollViewProps = {},
  withBackButton = false,
  onBackButtonPress,
  rightIcon,
  title,
  step = 0,
  totalSteps = 2,
  ...rest
}) => {
  const { styles, theme } = useTheme(getStyles)
  const { isOnboardingRoute } = useOnboardingNavigation()
  const { goBack } = useNavigation()
  const insets = useSafeAreaInsets()

  const handleBackButtonPress = () => {
    if (onBackButtonPress) {
      onBackButtonPress()
    } else {
      goBack()
    }
  }

  const renderProgress = () => (
    <View style={[styles.progressContainer]}>
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

  if (withScroll) {
    return (
      <View style={[flexbox.flex1, spacings.phSm]}>
        {step > 0 ? renderProgress() : <View style={{ height: isOnboardingRoute ? 24 : 0 }} />}
        {(!!title || !!withBackButton) && (
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
            {!!withBackButton && <PanelBackButton onPress={handleBackButtonPress} />}
            {!!title && <PanelTitle title={title} size={18} />}
            {!!withBackButton && (
              <View style={[{ width: 28 }, flexbox.alignCenter]}>{rightIcon}</View>
            )}
          </View>
        )}
        <KeyboardAwareScrollView
          ref={wrapperRef}
          style={flexbox.flex1}
          contentContainerStyle={[
            { flexGrow: 1, paddingBottom: insets.bottom || SPACING_SM },
            contentContainerStyle
          ]}
          bottomOffset={100}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
          {...keyboardAwareScrollViewProps}
          {...rest}
        >
          {children}
        </KeyboardAwareScrollView>
      </View>
    )
  }

  return (
    <View ref={wrapperRef} style={[flexbox.flex1, spacings.phSm, contentContainerStyle]}>
      {step > 0 ? renderProgress() : <View style={{ height: isOnboardingRoute ? 24 : 0 }} />}
      {(!!title || !!withBackButton) && (
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
          {!!withBackButton && <PanelBackButton onPress={handleBackButtonPress} />}
          {!!title && <PanelTitle title={title} size={18} />}
          {!!withBackButton && (
            <View style={[{ width: 28, maxHeight: 15 }, flexbox.center]}>{rightIcon}</View>
          )}
        </View>
      )}
      {children}
    </View>
  )
}

export { MobileLayoutContainer, MobileLayoutWrapperMainContent }

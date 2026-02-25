import React, { ReactNode } from 'react'
import { ColorValue, View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import ScrollableWrapper, { WrapperProps } from '@common/components/ScrollableWrapper'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type MobileLayoutContainerProps = {
  backgroundColor?: ColorValue
  header?: ReactNode
  footer?: ReactNode
  footerStyle?: ViewStyle
  children: ReactNode | ReactNode[]
  renderDirectChildren?: () => ReactNode
  style?: ViewStyle
  withHorizontalPadding?: boolean
}

export const MobileLayoutContainer = ({
  backgroundColor,
  header,
  footer,
  footerStyle,
  children,
  renderDirectChildren,
  style,
  withHorizontalPadding = true
}: MobileLayoutContainerProps) => {
  const { theme, styles } = useTheme(getStyles)
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        flexbox.flex1,
        {
          backgroundColor: backgroundColor || theme.primaryBackground,
          paddingTop: insets.top,
          paddingBottom: insets.bottom
        }
      ]}
    >
      {!!header && header}
      <View style={[flexbox.flex1, withHorizontalPadding ? spacings.phSm : undefined]}>
        <View
          style={[
            flexbox.directionRow,
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
        <View style={styles.footerContainer}>
          <View style={[styles.footer, footerStyle]}>{footer}</View>
        </View>
      )}
      {renderDirectChildren && renderDirectChildren()}
    </View>
  )
}

interface MobileLayoutWrapperMainContentProps extends WrapperProps {
  children: ReactNode
  withScroll?: boolean
  wrapperRef?: any
}

export const MobileLayoutWrapperMainContent: React.FC<MobileLayoutWrapperMainContentProps> = ({
  children,
  wrapperRef,
  contentContainerStyle = {},
  withScroll = true,
  ...rest
}: MobileLayoutWrapperMainContentProps) => {
  const { styles } = useTheme(getStyles)
  const { isOnboardingRoute } = useOnboardingNavigation()
  const { minHeightSize } = useWindowSize()

  if (withScroll && !isOnboardingRoute) {
    return (
      <ScrollableWrapper
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        wrapperRef={wrapperRef}
        {...rest}
      >
        {children}
      </ScrollableWrapper>
    )
  }

  return (
    <View ref={wrapperRef} style={[styles.contentContainer, contentContainerStyle]}>
      {children}
    </View>
  )
}

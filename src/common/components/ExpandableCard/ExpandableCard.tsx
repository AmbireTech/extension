import React, { ReactNode, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import { isMobile, isWeb } from '@common/config/env'
import { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

import getStyles from './styles'

const { isSidePanel } = getUiType()
const withMobileLayout = isMobile || isSidePanel

type ContentRenderProps = {
  isExpanded: boolean
}

type Props = {
  content: ReactNode | ((props: ContentRenderProps) => ReactNode)
  expandedContent?: ReactNode
  style?: ViewStyle
  enableToggleExpand?: boolean
  isInitiallyExpanded?: boolean
  hasArrow?: boolean
  arrowPosition?: 'left' | 'right'
  children?: ReactNode | ReactNode[]
  contentStyle?: ViewStyle
  mobileHeaderContent?: ReactNode
  mobileHeaderTitle?: ReactNode
  mobileHeaderStyle?: ViewStyle
  hideMobileContent?: boolean
  overlayMobileHeaderControls?: boolean
}

const ExpandableCard = ({
  style,
  enableToggleExpand = true,
  isInitiallyExpanded = false,
  hasArrow = true,
  arrowPosition = 'left',
  content,
  expandedContent,
  children,
  contentStyle,
  mobileHeaderContent,
  mobileHeaderTitle,
  mobileHeaderStyle,
  hideMobileContent = false,
  overlayMobileHeaderControls = false
}: Props) => {
  const { styles } = useTheme(getStyles)
  const [isExpanded, setIsExpanded] = useState(!!isInitiallyExpanded)
  const hasMobileHeader = withMobileLayout && (!!mobileHeaderContent || !!mobileHeaderTitle)

  const Element = enableToggleExpand ? AnimatedPressable : View
  const renderedContent = typeof content === 'function' ? content({ isExpanded }) : content

  const icon = useMemo(
    () => (
      <View
        style={{
          opacity: enableToggleExpand ? 1 : 0.5,
          width: 28,
          height: 24,
          // Stays centered against the always visible content even when the row
          // aligns its other children to the start
          alignSelf: 'center',
          ...flexbox.center
        }}
      >
        {isExpanded ? <UpArrowIcon /> : <DownArrowIcon />}
      </View>
    ),
    [enableToggleExpand, isExpanded]
  )

  return (
    <View style={[styles.container, withMobileLayout && isExpanded && { flexGrow: 1 }, style]}>
      <Element onPress={() => !!enableToggleExpand && setIsExpanded((prevState) => !prevState)}>
        {hasMobileHeader && (
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifySpaceBetween,
              spacings.phSm,
              spacings.ptTy,
              mobileHeaderStyle
            ]}
          >
            {!!hasArrow && arrowPosition === 'left' && icon}
            <View
              style={[
                flexbox.flex1,
                spacings.mlTy,
                // Reserve room for the overlaid controls so the title never runs under them
                overlayMobileHeaderControls && !!mobileHeaderContent
                  ? { paddingRight: 28 + SPACING_TY }
                  : {}
              ]}
            >
              {mobileHeaderTitle}
            </View>
            {!overlayMobileHeaderControls && mobileHeaderContent}
            {!!hasArrow && arrowPosition === 'right' && icon}
            {overlayMobileHeaderControls && !!mobileHeaderContent && (
              <View style={{ position: 'absolute', top: SPACING_TY, right: SPACING_SM }}>
                {mobileHeaderContent}
              </View>
            )}
          </View>
        )}
        {(!withMobileLayout || !hideMobileContent) && (
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              spacings.phSm,
              withMobileLayout ? spacings.pvTy : isWeb && spacings.pvSm,
              contentStyle
            ]}
          >
            {!hasMobileHeader && !!hasArrow && arrowPosition === 'left' && icon}
            <View
              style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1, { minWidth: 0 }]}
            >
              {!!renderedContent && renderedContent}
            </View>
            {!hasMobileHeader && !!hasArrow && arrowPosition === 'right' && icon}
          </View>
        )}
        {children}
      </Element>
      {!!isExpanded && !!expandedContent && expandedContent}
    </View>
  )
}

export default React.memo(ExpandableCard)

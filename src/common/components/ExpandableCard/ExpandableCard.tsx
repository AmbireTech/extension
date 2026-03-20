/* eslint-disable react/jsx-no-useless-fragment */
import React, { ReactNode, useMemo, useState } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import { isMobile, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type Props = {
  content: ReactNode
  expandedContent?: ReactNode
  style?: ViewStyle
  enableToggleExpand?: boolean
  isInitiallyExpanded?: boolean
  hasArrow?: boolean
  arrowPosition?: 'left' | 'right'
  children?: ReactNode | ReactNode[]
  contentStyle?: ViewStyle
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
  contentStyle
}: Props) => {
  const { styles } = useTheme(getStyles)
  const [isExpanded, setIsExpanded] = useState(!!isInitiallyExpanded)

  const Element = enableToggleExpand ? Pressable : View

  const icon = useMemo(
    () => (
      <View
        style={{
          opacity: enableToggleExpand ? 1 : 0.5,
          width: 28,
          height: 28,
          ...flexbox.center
        }}
      >
        {isExpanded ? <UpArrowIcon /> : <DownArrowIcon />}
      </View>
    ),
    [enableToggleExpand, isExpanded]
  )

  return (
    <View style={[styles.container, style]}>
      <Element onPress={() => !!enableToggleExpand && setIsExpanded((prevState) => !prevState)}>
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            spacings.phSm,
            isWeb && spacings.pvSm,
            isMobile && spacings.pvTy,
            contentStyle
          ]}
        >
          {!!hasArrow && arrowPosition === 'left' && icon}
          <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
            {!!content && content}
          </View>
          {!!hasArrow && arrowPosition === 'right' && icon}
        </View>
        {children}
      </Element>
      {!!isExpanded && !!expandedContent && expandedContent}
    </View>
  )
}

export default React.memo(ExpandableCard)

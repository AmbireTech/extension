/* eslint-disable react/jsx-no-useless-fragment */
import React, { ReactElement, useState } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type Props = {
  content: ReactElement
  expandedContent?: ReactElement
  style?: ViewStyle
  enableToggleExpand?: boolean
  isInitiallyExpanded?: boolean
  hasArrow?: boolean
  arrowPosition?: 'left' | 'right'
  children?: ReactElement | ReactElement[]
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

  return (
    <View style={[styles.container, style]}>
      <Element onPress={() => !!enableToggleExpand && setIsExpanded((prevState) => !prevState)}>
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            spacings.phSm,
            spacings.pvSm,
            contentStyle
          ]}
        >
          {!!hasArrow && arrowPosition === 'left' && (
            <View style={{ opacity: enableToggleExpand ? 1 : 0.5 }}>
              {isExpanded ? <UpArrowIcon /> : <DownArrowIcon />}
            </View>
          )}
          <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
            {!!content && content}
          </View>
          {!!hasArrow && arrowPosition === 'right' && (
            <View style={{ opacity: enableToggleExpand ? 1 : 0.5 }}>
              {isExpanded ? <UpArrowIcon /> : <DownArrowIcon />}
            </View>
          )}
        </View>
        {children}
      </Element>
      {!!isExpanded && !!expandedContent && expandedContent}
    </View>
  )
}

export default React.memo(ExpandableCard)

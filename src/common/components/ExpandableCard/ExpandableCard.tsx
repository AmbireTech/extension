/* eslint-disable react/jsx-no-useless-fragment */
import React, { useState } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type Props = {
  content: any
  expandedContent: any
  style?: ViewStyle
  enableExpand?: boolean
  hasArrow?: boolean
  children?: any
}

const ExpandableCard = ({
  style,
  enableExpand = true,
  hasArrow = true,
  content = <></>,
  expandedContent = <></>,
  children
}: Props) => {
  const { styles } = useTheme(getStyles)
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <View style={[styles.container, style]}>
      <Pressable onPress={() => setIsExpanded((prevState) => !prevState)}>
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.phSm, spacings.pvSm]}>
          {!!hasArrow && !!isExpanded ? <UpArrowIcon /> : <DownArrowIcon />}
          {content}
        </View>
        {children}
      </Pressable>
      {!!enableExpand && !!isExpanded && expandedContent}
    </View>
  )
}

export default ExpandableCard

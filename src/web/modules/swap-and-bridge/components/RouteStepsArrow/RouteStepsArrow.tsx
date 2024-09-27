import React, { ReactElement, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

const RouteStepsArrow = ({
  containerStyle,
  badge,
  badgeStyle,
  type
}: {
  containerStyle?: ViewStyle
  badge?: ReactElement | null
  badgeStyle?: ViewStyle
  type?: 'default' | 'warning' | 'success'
}) => {
  const { styles, theme } = useTheme(getStyles)

  const getArrowColor = useMemo(() => {
    if (type === 'warning') return theme.warningDecorative
    if (type === 'success') return theme.successDecorative

    return theme.secondaryBorder
  }, [theme, type])

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.arrowStart, { borderColor: getArrowColor }]} />
      <View style={[styles.arrowLine, { borderColor: getArrowColor }]}>
        {!!badge && (
          <View style={{ backgroundColor: theme.secondaryBackground }}>
            <View style={[styles.badge, badgeStyle]}>{badge}</View>
          </View>
        )}
      </View>
      <View style={styles.arrowTipWrapper}>
        <RightArrowIcon color={getArrowColor} height={11} />
      </View>
    </View>
  )
}

export default React.memo(RouteStepsArrow)

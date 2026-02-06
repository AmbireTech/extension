import React, { ReactNode, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import CheckIcon from '@common/assets/svg/CheckIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Spinner from '@common/components/Spinner'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

const RouteStepsArrow = ({
  containerStyle,
  badge,
  badgeStyle,
  badgePosition = 'middle',
  type,
  isLoading
}: {
  containerStyle?: ViewStyle
  badge?: ReactNode | null
  badgePosition?: 'top' | 'middle'
  badgeStyle?: ViewStyle
  type?: 'default' | 'warning' | 'success'
  isLoading?: boolean
}) => {
  const { styles, theme } = useTheme(getStyles)

  const getArrowColor = useMemo(() => {
    if (type === 'warning') return theme.warningDecorative
    if (type === 'success') return theme.successDecorative

    return theme.secondaryBorder
  }, [theme, type])

  return (
    <View style={[styles.container, containerStyle]}>
      <View
        style={[
          styles.arrowLine,
          type === 'success' && styles.arrowLineSuccess,
          { borderColor: getArrowColor }
        ]}
      >
        {!(badgePosition === 'middle' && !!badge) && (
          <View>
            {type === 'success' ? (
              <CheckIcon width={14} height={14} color={theme.successDecorative} />
            ) : (
              <View style={[styles.arrowStatus, { borderColor: getArrowColor }]}>
                {isLoading && <Spinner style={{ width: 14 }} />}
              </View>
            )}
          </View>
        )}
        {!!badge && (
          <View style={{ backgroundColor: theme.secondaryBackground }}>
            <View
              style={[
                badgePosition === 'middle' && styles.badgeMiddle,
                badgePosition === 'top' && styles.badgeTop,

                badgeStyle
              ]}
            >
              {badge}
            </View>
          </View>
        )}
      </View>
      <View style={[styles.arrowTipWrapper]}>
        <View style={[styles.arrowConnector, { borderColor: getArrowColor }]} />
        <RightArrowIcon color={getArrowColor} height={11} />
      </View>
    </View>
  )
}

export default React.memo(RouteStepsArrow)

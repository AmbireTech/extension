import { nanoid } from 'nanoid'
import React from 'react'
import { View } from 'react-native'

import InformationIcon from '@common/assets/svg/InformationIcon'
import MetamaskIcon from '@common/assets/svg/Metamask/MetamaskIcon'
import StarsIcon from '@common/assets/svg/StarsIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

import { createGlobalTooltipDataSet } from '../GlobalTooltip'
import getStyles from './styles'
import { Props } from './types'

const getBadgeTypes = (theme: ThemeProps) => ({
  info: {
    color: theme.infoText,
    iconColor: theme.infoDecorative
  },
  info2: {
    color: theme.info2Text,
    iconColor: theme.info2Decorative
  },
  default: {
    color: theme.secondaryText,
    iconColor: theme.secondaryText
  },
  success: {
    color: theme.successText,
    iconColor: theme.successDecorative
  },
  warning: {
    color: theme.warningText,
    iconColor: theme.warningDecorative
  },
  error: {
    color: theme.errorText,
    iconColor: theme.errorDecorative
  },
  ok: {
    color: theme.secondaryText,
    iconColor: theme.successText
  },
  projectedRewards: {
    color: theme.projectedRewards,
    iconColor: theme.projectedRewards
  },
  new: {
    color: '#fff',
    iconColor: '#fff'
  }
})

const SIZES = {
  sm: 1,
  md: 1.25,
  lg: 1.5
}

const Badge = ({
  text,
  textStyle,
  weight,
  tooltipText,
  withRightSpacing,
  type = 'default',
  style,
  nativeID,
  children,
  size = 'sm',
  specialType,
  testId
}: Props) => {
  const { styles, theme } = useTheme(getStyles)
  const badgeTypes = getBadgeTypes(theme)
  const { color, iconColor } = badgeTypes[type] || badgeTypes.default
  const tooltipId = nanoid(6)
  const sizeMultiplier = SIZES[size]

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        type === 'success' && styles.successBadge,
        type === 'default' && styles.defaultBadge,
        type === 'warning' && styles.warningBadge,
        type === 'info' && styles.infoBadge,
        type === 'info2' && styles.info2Badge,
        type === 'error' && styles.errorBadge,
        type === 'new' && styles.newBadge,
        type === 'projectedRewards' && styles.projectedRewards,
        {
          height: sizeMultiplier * 20
        },
        withRightSpacing && spacings.mrMd,
        !!tooltipText && spacings.prMi,
        style
      ]}
      nativeID={nativeID}
      testID={testId}
    >
      {text && (
        <Text
          weight={weight || (type === 'new' ? 'semiBold' : 'regular')}
          fontSize={sizeMultiplier * 10}
          color={color}
          style={[!!tooltipText && spacings.mrMi, textStyle]}
        >
          {text}
        </Text>
      )}
      {children}
      {!!tooltipText && type !== 'new' && !specialType && (
        <InformationIcon
          dataSet={createGlobalTooltipDataSet({
            id: tooltipId,
            content: tooltipText
          })}
          data-tooltip-id={tooltipId}
          color={iconColor}
          width={sizeMultiplier * 14}
          height={sizeMultiplier * 14}
        />
      )}
      {!!tooltipText &&
        type !== 'new' &&
        specialType &&
        specialType === 'metamask' &&
        text === 'Metamask' && (
          <MetamaskIcon
            // @ts-ignore
            dataSet={createGlobalTooltipDataSet({
              id: tooltipId,
              content: tooltipText
            })}
            width={sizeMultiplier * 14}
            height={sizeMultiplier * 14}
          />
        )}
      {type === 'new' && (
        <StarsIcon
          style={spacings.mlMi}
          color={iconColor}
          width={sizeMultiplier * 11}
          height={sizeMultiplier * 11}
        />
      )}
    </View>
  )
}

export default React.memo(Badge)

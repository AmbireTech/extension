import { nanoid } from 'nanoid'
import React from 'react'
import { View } from 'react-native'

import InfoIcon from '@common/assets/svg/InfoIcon'
import MetamaskIcon from '@common/assets/svg/Metamask/MetamaskIcon'
import StarsIcon from '@common/assets/svg/StarsIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_MI } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'
import { Props } from './types'

const getBadgeTypes = (theme: ThemeProps) => ({
  info: {
    color: theme.infoText,
    backgroundColor: theme.infoBackground
  },
  default: {
    color: theme.neutral600,
    backgroundColor: theme.secondaryBackground
  },
  outline: {
    color: theme.neutral600,
    backgroundColor: 'transparent'
  },
  success: {
    color: theme.successText,
    backgroundColor: theme.successBackground
  },
  warning: {
    color: theme.warningText,
    backgroundColor: theme.warningBackground
  },
  error: {
    color: theme.errorText,
    backgroundColor: theme.errorBackground
  },
  primaryAccent: {
    color: theme.primaryAccent300,
    backgroundColor: theme.primaryAccent100
  },
  secondaryAccent: {
    color: theme.secondaryAccent400,
    backgroundColor: theme.secondaryAccent100
  },
  new: {
    color: theme.neutral400,
    backgroundColor: 'transparent'
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
  testId,
  isIconLeading = false
}: Props) => {
  const { styles, theme } = useTheme(getStyles)
  const badgeTypes = getBadgeTypes(theme)
  const { color, backgroundColor } = badgeTypes[type] || badgeTypes.default
  const tooltipId = nanoid(6)
  const sizeMultiplier = SIZES[size]

  const hasIcon = !!tooltipText || !!children

  const icons = (
    <>
      {children}
      {!!tooltipText && !specialType && (
        <InfoIcon
          dataSet={createGlobalTooltipDataSet({
            id: tooltipId,
            content: tooltipText
          })}
          data-tooltip-id={tooltipId}
          color={color}
          width={sizeMultiplier * 16}
          height={sizeMultiplier * 16}
        />
      )}
      {!!tooltipText && specialType && specialType === 'metamask' && text === 'Metamask' && (
        <MetamaskIcon
          dataSet={createGlobalTooltipDataSet({
            id: tooltipId,
            content: tooltipText
          })}
          width={sizeMultiplier * 14}
          height={sizeMultiplier * 14}
        />
      )}
    </>
  )

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        styles.badge,
        {
          height: sizeMultiplier * 20,
          backgroundColor: backgroundColor
        },
        type === 'outline' && styles.outlineBadge,
        type === 'new' && styles.newBadge,
        withRightSpacing && spacings.mrMd,
        // Less padding on the side of the icon, as it has room around it already
        hasIcon &&
          (isIconLeading
            ? { paddingLeft: sizeMultiplier * SPACING_MI }
            : { paddingRight: sizeMultiplier * 2 }),
        style
      ]}
      nativeID={nativeID}
      testID={testId}
    >
      {isIconLeading && icons}
      {!!text && (
        <Text
          weight={weight || 'medium'}
          fontSize={12}
          color={color}
          style={[
            isIconLeading
              ? hasIcon && spacings.mlMi
              : (!!tooltipText || type === 'new') && spacings.mrMi,
            textStyle
          ]}
        >
          {text}
        </Text>
      )}
      {type === 'new' && (
        <StarsIcon
          width={12 * sizeMultiplier}
          height={12 * sizeMultiplier}
          color={theme.neutral400}
        />
      )}
      {!isIconLeading && icons}
    </View>
  )
}

export default React.memo(Badge)

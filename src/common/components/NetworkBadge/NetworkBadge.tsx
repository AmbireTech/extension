import React, { FC, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import NetworkIcon from '@common/components/NetworkIcon'
import Text, { TextWeight } from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import { SPACING_MI, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  chainId?: bigint
  withOnPrefix?: boolean
  style?: ViewStyle
  iconStyle?: ViewStyle
  fontSize?: number
  weight?: TextWeight
  iconSize?: number
  withIcon?: boolean
  renderNetworkName?: (networkName: string) => React.ReactNode
  responsiveSizeMultiplier?: number
}

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

const NetworkBadge: FC<Props> = ({
  chainId,
  withOnPrefix,
  style,
  fontSize,
  weight,
  iconSize,
  withIcon = true,
  renderNetworkName,
  responsiveSizeMultiplier = 1,
  iconStyle = {}
}) => {
  const { isNarrowWebLayout } = useCompactActionRequestLayout()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { state: networks } = useController('NetworksController', selectNetworks)

  const network = useMemo(() => {
    return networks.find((n) => n.chainId === chainId)
  }, [chainId, networks])

  const networkName = useMemo(() => network?.name || t('Unknown network'), [network?.name, t])

  const iconSizeScaled = useMemo(() => {
    if (isNarrowWebLayout) return iconSize || 16

    return (iconSize || 24) * responsiveSizeMultiplier
  }, [iconSize, responsiveSizeMultiplier, isNarrowWebLayout])

  if (!chainId) return null

  return (
    <View
      style={{
        ...flexbox.directionRow,
        ...flexbox.alignCenter,
        paddingLeft: isNarrowWebLayout ? SPACING_TY : SPACING_SM * responsiveSizeMultiplier,
        paddingRight: isNarrowWebLayout ? SPACING_TY : SPACING_TY * responsiveSizeMultiplier,
        paddingVertical: 2,
        borderRadius: isNarrowWebLayout ? 20 : 50 * responsiveSizeMultiplier,
        borderWidth: 1,
        height: isNarrowWebLayout ? 32 : 40,
        borderColor: theme.primaryBorder,
        ...(isNarrowWebLayout ? { flexShrink: 1, minWidth: 0 } : {}),
        ...style
      }}
    >
      <Text
        fontSize={isNarrowWebLayout ? 12 : fontSize || 16 * responsiveSizeMultiplier}
        weight={weight || 'medium'}
        appearance="secondaryText"
        numberOfLines={isNarrowWebLayout ? 1 : undefined}
        style={isNarrowWebLayout ? { flexShrink: 1, minWidth: 0 } : undefined}
      >
        {withOnPrefix ? t('on ') : null}
        {!renderNetworkName ? networkName : renderNetworkName(networkName)}
      </Text>
      {withIcon && (
        <NetworkIcon
          key={network?.chainId.toString() || networkName}
          style={{
            marginLeft: isNarrowWebLayout ? SPACING_MI : SPACING_TY * responsiveSizeMultiplier,
            flexShrink: 0,
            ...iconStyle
          }}
          id={network?.chainId.toString() || networkName}
          size={iconSizeScaled}
        />
      )}
    </View>
  )
}

export default memo(NetworkBadge)

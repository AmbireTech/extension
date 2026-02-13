import React, { FC, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import NetworkIcon from '@common/components/NetworkIcon'
import Text, { TextWeight } from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'

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
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { networks } = useNetworksControllerState()

  const network = useMemo(() => {
    return networks.find((n) => n.chainId === chainId)
  }, [chainId, networks])

  const networkName = useMemo(() => network?.name || t('Unknown network'), [network?.name, t])

  const iconSizeScaled = useMemo(() => {
    return (iconSize || 24) * responsiveSizeMultiplier
  }, [iconSize, responsiveSizeMultiplier])

  if (!chainId) return null

  return (
    <View
      style={{
        ...flexbox.directionRow,
        ...flexbox.alignCenter,
        paddingLeft: SPACING_SM * responsiveSizeMultiplier,
        paddingRight: SPACING_TY * responsiveSizeMultiplier,
        paddingVertical: 2,
        borderRadius: 50 * responsiveSizeMultiplier,
        borderWidth: 1,
        height: 40,
        borderColor: theme.primaryBorder,
        ...style
      }}
    >
      <Text
        fontSize={fontSize || 16 * responsiveSizeMultiplier}
        weight={weight || 'medium'}
        appearance="secondaryText"
      >
        {withOnPrefix ? t('on ') : null}
        {!renderNetworkName ? networkName : renderNetworkName(networkName)}
      </Text>
      {withIcon && (
        <NetworkIcon
          key={network?.chainId.toString() || networkName}
          style={{
            marginLeft: SPACING_TY * responsiveSizeMultiplier,
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

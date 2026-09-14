import React, { FC, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import NetworkIcon from '@common/components/NetworkIcon'
import Text, { TextWeight } from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import { SPACING_MI, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

const { isSidePanel } = getUiType()

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
  const { state: networks } = useController('NetworksController', 'networks')

  const network = useMemo(() => {
    return networks.find((n) => n.chainId === chainId)
  }, [chainId, networks])

  const networkName = useMemo(() => network?.name || t('Unknown network'), [network?.name, t])

  const iconSizeScaled = useMemo(() => {
    if (isSidePanel) return iconSize || 16

    return (iconSize || 24) * responsiveSizeMultiplier
  }, [iconSize, responsiveSizeMultiplier])

  if (!chainId) return null

  return (
    <View
      style={{
        ...flexbox.directionRow,
        ...flexbox.alignCenter,
        paddingLeft: isSidePanel ? SPACING_TY : SPACING_SM * responsiveSizeMultiplier,
        paddingRight: isSidePanel ? SPACING_TY : SPACING_TY * responsiveSizeMultiplier,
        paddingVertical: 2,
        borderRadius: isSidePanel ? 20 : 50 * responsiveSizeMultiplier,
        borderWidth: 1,
        height: isSidePanel ? 32 : 40,
        borderColor: theme.primaryBorder,
        ...(isSidePanel ? { flexShrink: 1, minWidth: 0 } : {}),
        ...style
      }}
    >
      <Text
        fontSize={isSidePanel ? 12 : fontSize || 16 * responsiveSizeMultiplier}
        weight={weight || 'medium'}
        appearance="secondaryText"
        numberOfLines={isSidePanel ? 1 : undefined}
        style={isSidePanel ? { flexShrink: 1, minWidth: 0 } : undefined}
      >
        {withOnPrefix ? t('on ') : null}
        {!renderNetworkName ? networkName : renderNetworkName(networkName)}
      </Text>
      {withIcon && (
        <NetworkIcon
          key={network?.chainId.toString() || networkName}
          style={{
            marginLeft: isSidePanel ? SPACING_MI : SPACING_TY * responsiveSizeMultiplier,
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

import React, { FC, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TextStyle, View, ViewStyle } from 'react-native'

import NetworkIcon from '@common/components/NetworkIcon'
import Text, { TextWeight } from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import { SPACING, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

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
  const {
    state: { networks }
  } = useController('NetworksController')

  const network = useMemo(() => {
    return networks.find((n) => n.chainId === chainId)
  }, [chainId, networks])

  const networkName = useMemo(() => network?.name || t('Unknown network'), [network?.name, t])

  const iconSizeScaled = useMemo(() => {
    return (iconSize || 32) * responsiveSizeMultiplier
  }, [iconSize, responsiveSizeMultiplier])

  if (!chainId) return null

  return (
    <View
      style={{
        ...flexbox.directionRow,
        ...flexbox.alignCenter,
        paddingLeft: SPACING * responsiveSizeMultiplier,
        paddingRight: SPACING_TY * responsiveSizeMultiplier,
        paddingVertical: 2,
        borderRadius: 50 * responsiveSizeMultiplier,
        backgroundColor: theme.secondaryBackground,
        ...style
      }}
    >
      <Text
        fontSize={fontSize || 16 * responsiveSizeMultiplier}
        weight={weight || 'medium'}
        appearance="secondaryText"
      >
        {withOnPrefix ? (
          <Text
            fontSize={fontSize || 16 * responsiveSizeMultiplier}
            weight={weight || 'medium'}
            appearance="tertiaryText"
          >
            on{' '}
          </Text>
        ) : null}
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

import React, { FC, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import Text, { TextWeight } from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'

import NetworkIcon from '../NetworkIcon'

interface Props {
  networkId?: Network['id']
  withOnPrefix?: boolean
  style?: ViewStyle
  fontSize?: number
  weight?: TextWeight
  iconSize?: number
}

const NetworkBadge: FC<Props> = ({
  networkId,
  withOnPrefix,
  style,
  fontSize = 16,
  weight,
  iconSize = 32
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { networks } = useNetworksControllerState()

  const networkName = useMemo(() => {
    return networks.find((network) => network.id === networkId)?.name
  }, [networkId, networks])

  if (!networkId) return null

  return (
    <View
      style={{
        ...flexbox.directionRow,
        ...flexbox.alignCenter,
        ...spacings.pl,
        ...spacings.prTy,
        ...spacings.pvMi,
        borderRadius: BORDER_RADIUS_PRIMARY,
        backgroundColor: theme.secondaryBackground,
        ...style
      }}
    >
      <Text fontSize={fontSize} weight={weight || 'medium'} appearance="secondaryText">
        {withOnPrefix ? (
          <Text fontSize={fontSize} weight={weight || 'medium'} appearance="tertiaryText">
            on{' '}
          </Text>
        ) : null}
        {networkName || t('Unknown network')}
      </Text>
      <NetworkIcon style={{ backgroundColor: 'transparent' }} id={networkId} size={iconSize} />
    </View>
  )
}

export default memo(NetworkBadge)

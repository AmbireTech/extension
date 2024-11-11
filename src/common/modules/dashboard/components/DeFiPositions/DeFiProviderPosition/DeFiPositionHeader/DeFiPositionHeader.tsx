import React, { FC, useCallback, useMemo } from 'react'
import { Animated, View } from 'react-native'

import { PositionsByProvider } from '@ambire-common/libs/defiPositions/types'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import getStyles from '@common/modules/dashboard/components/DeFiPositions/DeFiProviderPosition/styles'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import formatDecimals from '@common/utils/formatDecimals'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import useDappsControllerState from '@web/hooks/useDappsControllerState'
import useHover, { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'

import Badge from './Badge'
import ProtocolIcon from './ProtocolIcon'

type Props = Omit<PositionsByProvider, 'type' | 'positionInUSD' | 'positions'> & {
  toggleExpanded: () => void
  isExpanded: boolean
  positionInUSD?: string
  healthRate?: number
}

const HEALTH_RATE_LEVELS: {
  to: number
  color: 'success' | 'info' | 'error' | 'warning'
}[] = [
  {
    to: 1.2,
    color: 'error'
  },
  {
    to: 2.8,
    color: 'warning'
  },
  {
    to: 100,
    color: 'success'
  }
]

const DeFiPositionHeader: FC<Props> = ({
  providerName,
  toggleExpanded,
  networkId,
  positionInUSD,
  isExpanded,
  healthRate
}) => {
  const {
    state: { dapps }
  } = useDappsControllerState()
  const { styles, theme } = useTheme(getStyles)
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: { from: theme.quaternaryBackgroundSolid, to: theme.secondaryBackground },
    forceHoveredStyle: isExpanded
  })
  const [bindOpenIconAnim, openIconAnimStyle] = useHover({
    preset: 'opacityInverted'
  })

  const dappUrl = useMemo(() => {
    const providerNameWithoutVersion = providerName.split(' ')[0].toLowerCase()
    const dapp = dapps.find((d) => d.name.toLowerCase().includes(providerNameWithoutVersion))

    return dapp?.url
  }, [dapps, providerName])

  const openDAppUrl = useCallback(async () => {
    try {
      await openInTab(dappUrl, false)
    } catch (e) {
      console.error(e)
    }
  }, [dappUrl])

  return (
    <AnimatedPressable
      onPress={toggleExpanded}
      style={[styles.header, animStyle, !!isExpanded && styles.expandedHeader]}
      {...bindAnim}
    >
      <View style={styles.providerData}>
        <ProtocolIcon providerName={providerName} networkId={networkId} />
        <Text fontSize={16} weight="semiBold" style={spacings.mrMi}>
          {providerName}
        </Text>
        {dappUrl && (
          <AnimatedPressable onPress={openDAppUrl} style={openIconAnimStyle} {...bindOpenIconAnim}>
            <OpenIcon width={14} height={14} color={theme.secondaryText} />
          </AnimatedPressable>
        )}
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mlLg]}>
          {healthRate && (
            <Badge
              text={`Health Rate: ${healthRate <= 10 ? formatDecimals(healthRate) : '>10'}`}
              type={HEALTH_RATE_LEVELS.find((level) => level.to >= healthRate)?.color || 'success'}
            />
          )}
          {/* @TODO: TOTAL APY {APY && <Badge text={`Total APY: ${formatDecimals(APY)}`} type="info" />} */}
        </View>
      </View>
      <View style={styles.positionData}>
        <Text fontSize={16} weight="semiBold" style={spacings.mrSm}>
          {positionInUSD}
        </Text>
        <Animated.View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
          <DownArrowIcon color={theme.secondaryText} />
        </Animated.View>
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(DeFiPositionHeader)

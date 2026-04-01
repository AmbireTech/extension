import React, { FC, useCallback, useMemo } from 'react'
import { Animated, View } from 'react-native'

import { PositionsByProvider } from '@ambire-common/libs/defiPositions/types'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useHover, { AnimatedPressable, useCustomHover, useMultiHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import getStyles from '@common/modules/dashboard/components/DeFiPositions/DeFiProviderPosition/styles'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'

import Badge from './Badge'
import ProtocolIcon from './ProtocolIcon'

type Props = Omit<PositionsByProvider, 'type' | 'positionInUSD' | 'positions' | 'source'> & {
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
  chainId,
  positionInUSD,
  isExpanded,
  healthRate,
  iconUrl,
  siteUrl
}) => {
  const {
    state: { dapps }
  } = useController('DappsController')
  const { styles, theme } = useTheme(getStyles)
  const [bindAnim, animStyle] = useMultiHover({
    values: [
      {
        property: 'backgroundColor',
        from: theme.secondaryBackground,
        to: theme.tertiaryBackground
      },
      {
        property: 'borderColor',
        from: hexToRgba(theme.primaryBorder, 0),
        to: theme.primaryBorder
      }
    ]
  })
  const [bindOpenIconAnim, openIconAnimStyle] = useHover({
    preset: 'opacityInverted'
  })

  const dappUrl = useMemo(() => {
    if (siteUrl) return siteUrl

    const providerNameWithoutVersion = providerName.split(' ')[0]?.toLowerCase() || ''
    const dapp = dapps.find((d) => d.name.toLowerCase().includes(providerNameWithoutVersion))

    return dapp?.url
  }, [dapps, providerName, siteUrl])

  const openDAppUrl = useCallback(async () => {
    if (!dappUrl) return
    try {
      await openInTab({ url: dappUrl })
    } catch (e) {
      console.error(e)
    }
  }, [dappUrl])

  return (
    <AnimatedPressable
      onPress={toggleExpanded}
      style={[
        styles.header,
        animStyle,
        !!isExpanded && styles.expandedHeader,
        isExpanded && {
          backgroundColor: theme.tertiaryBackground,
          borderColor: theme.primaryBorder
        }
      ]}
      {...bindAnim}
    >
      <View style={styles.providerData}>
        <ProtocolIcon iconUrl={iconUrl} providerName={providerName} chainId={chainId} />
        <View>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Text fontSize={16} weight="semiBold" style={spacings.mrMi}>
              {providerName}
            </Text>
            {dappUrl && (
              <AnimatedPressable
                onPress={openDAppUrl}
                style={openIconAnimStyle}
                {...bindOpenIconAnim}
              >
                <OpenIcon width={14} height={14} color={theme.secondaryText} />
              </AnimatedPressable>
            )}
          </View>
          {isMobile && !!healthRate && (
            <Badge
              text={`Health Rate: ${healthRate <= 10 ? formatDecimals(healthRate) : '>10'}`}
              type={HEALTH_RATE_LEVELS.find((level) => level.to >= healthRate)?.color || 'success'}
              style={spacings.mtMi}
            />
          )}
        </View>
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            isMobile ? spacings.mlTy : spacings.mlLg
          ]}
        >
          {isWeb && !!healthRate && (
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

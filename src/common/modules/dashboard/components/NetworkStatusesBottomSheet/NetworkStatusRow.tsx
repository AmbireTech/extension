import React, { FC, useEffect, useState } from 'react'
import { Animated, ColorValue, View, ViewStyle } from 'react-native'

import { PortfolioNetworkResult } from '@ambire-common/libs/portfolio/interfaces'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import { formatResultTime, getCellStyle, getTimeAgo } from './helpers'

const LastUpdatedAtElapsed: FC<{ lastUpdatedAt?: number }> = ({ lastUpdatedAt }) => {
  const [elapsed, setElapsed] = useState(lastUpdatedAt ? getTimeAgo(new Date(lastUpdatedAt)) : '')

  useEffect(() => {
    if (!lastUpdatedAt) {
      setElapsed('')
      return
    }

    setElapsed(getTimeAgo(new Date(lastUpdatedAt)))

    const interval = setInterval(() => {
      setElapsed(getTimeAgo(new Date(lastUpdatedAt)))
    }, 5000)

    return () => clearInterval(interval)
  }, [lastUpdatedAt])

  if (!lastUpdatedAt) return null

  return (
    <Text fontSize={10} appearance="secondaryText">
      {elapsed}
    </Text>
  )
}

const Cell: FC<{
  backgroundColor: ColorValue
  time: number | undefined
  color: ColorValue
  style?: ViewStyle
}> = ({ backgroundColor, time, color, style = {} }) => (
  <View style={{ flex: 1, alignItems: 'center', ...style }}>
    <View
      style={{
        backgroundColor: backgroundColor,
        ...spacings.phTy,
        ...spacings.pvMi,
        ...common.borderRadiusSecondary,
        minWidth: 60,
        alignItems: 'center'
      }}
    >
      <Text fontSize={12} weight="medium" style={{ color: color }}>
        {time ? formatResultTime(time) : 'Skipped'}
      </Text>
    </View>
  </View>
)

const NetworkStatusRow: FC<{
  networkKey: string
  name: string
  lastUpdatedAt?: number
  totalTime: number
  isLoading: boolean
  result?: PortfolioNetworkResult
  theme: ReturnType<typeof useTheme>['theme']
}> = ({ networkKey, name, lastUpdatedAt, totalTime, isLoading, result, theme }) => {
  const discoveryStyle = result
    ? getCellStyle(result.discoveryTime, 'discovery', theme)
    : getCellStyle(0, 'discovery', theme)
  const priceStyle = result
    ? getCellStyle(result.priceUpdateTime, 'priceUpdate', theme)
    : getCellStyle(0, 'priceUpdate', theme)
  const oracleStyle = result
    ? getCellStyle(result.oracleCallTime, 'oracleCall', theme)
    : getCellStyle(0, 'oracleCall', theme)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pulseOpacityAnim = new Animated.Value(0.7)

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacityAnim, {
            toValue: 0.7,
            duration: 400,
            useNativeDriver: true
          }),
          Animated.timing(pulseOpacityAnim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true
          })
        ])
      ).start()
    } else {
      pulseOpacityAnim.stopAnimation()
      pulseOpacityAnim.setValue(0.7)
    }
  }, [isLoading, pulseOpacityAnim])

  return (
    <Animated.View
      key={networkKey}
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.mbTy,
        spacings.pvTy,
        common.borderRadiusPrimary,
        {
          backgroundColor: theme.secondaryBackground,
          opacity: isLoading ? pulseOpacityAnim : 1
        }
      ]}
    >
      {/* Network data */}
      <View style={[{ flex: 2 }, flexbox.directionRow, flexbox.alignCenter]}>
        <NetworkIcon
          id={networkKey}
          size={32}
          scale={0.7}
          style={{ ...spacings.mrMi, ...spacings.mlTy }}
        />
        <View>
          <Text fontSize={14} weight="medium">
            {name}
          </Text>
          <LastUpdatedAtElapsed lastUpdatedAt={lastUpdatedAt} />
        </View>
      </View>
      {/* Time taken */}
      {result ? (
        <>
          <Cell
            backgroundColor="transparent"
            time={totalTime}
            color={theme.secondaryText}
            style={{ flex: 1.5 }}
          />
          <Cell
            backgroundColor={discoveryStyle.backgroundColor}
            time={result?.discoveryTime}
            color={discoveryStyle.color}
          />
          <Cell
            backgroundColor={priceStyle.backgroundColor}
            time={result?.priceUpdateTime}
            color={priceStyle.color}
          />
          <Cell
            backgroundColor={oracleStyle.backgroundColor}
            time={result?.oracleCallTime}
            color={oracleStyle.color}
          />
        </>
      ) : (
        <Text fontSize={12} appearance="secondaryText" style={{ flex: 4, textAlign: 'center' }}>
          No data
        </Text>
      )}
    </Animated.View>
  )
}

export default NetworkStatusRow

import { formatUnits } from 'ethers'
import React, { FC, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import { AssetType, Position } from '@ambire-common/libs/defiPositions/types'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import DeFiPositionAssetsHeader from './DeFiPositionAssetsHeader'

const COLUMNS = [
  { label: 'AMOUNT', flex: 1 },
  { label: 'USD VALUE', flex: 0.75 }
]

const COLUMNS_WITH_APY = [
  { label: 'AMOUNT', flex: 0.9 },
  { label: 'APY', flex: 0.55 },
  { label: 'USD VALUE', flex: 0.75 }
]

const getColumnStyle = (flex: number): ViewStyle => ({ flex, minWidth: 0 })

const DeFiPositionAssets: FC<{
  assets: Position['assets']
  label: string
  chainId?: bigint
}> = ({ assets, label, chainId }) => {
  const { isCompactLayout } = useCompactActionRequestLayout()
  const shouldDisplayAPY = assets.some((a) => !!a?.additionalData?.APY)
  const rowFontSize = isCompactLayout ? 12 : 14

  const columns = useMemo(() => {
    return [
      {
        label,
        flex: isCompactLayout ? 1.1 : 1
      },
      ...(shouldDisplayAPY ? COLUMNS_WITH_APY : COLUMNS)
    ]
  }, [isCompactLayout, label, shouldDisplayAPY])

  return (
    <View>
      <DeFiPositionAssetsHeader columns={columns} />
      <View style={spacings.ptMi}>
        {assets.map(
          ({ symbol, amount, decimals, type, address, additionalData, value, iconUrl }) => {
            return (
              <View
                style={[
                  flexbox.directionRow,
                  spacings.phSm,
                  spacings.pvTy,
                  flexbox.alignCenter,
                  { minWidth: 0, overflow: 'hidden' }
                ]}
                key={address}
              >
                <View
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    getColumnStyle(isCompactLayout ? 1.1 : 1)
                  ]}
                >
                  {type !== AssetType.Prediction && (
                    <TokenIcon
                      width={isCompactLayout ? 20 : 24}
                      height={isCompactLayout ? 20 : 24}
                      uri={iconUrl}
                      withContainer={false}
                      chainId={chainId}
                      address={address}
                      withNetworkIcon={false}
                    />
                  )}
                  <Text
                    fontSize={rowFontSize}
                    weight="semiBold"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      type !== AssetType.Prediction ? spacings.mlTy : undefined,
                      { flexShrink: 1, minWidth: 0 }
                    ]}
                  >
                    {symbol}
                  </Text>
                </View>
                <Text
                  style={getColumnStyle(shouldDisplayAPY ? 0.9 : 1)}
                  fontSize={rowFontSize}
                  weight="semiBold"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {formatDecimals(Number(formatUnits(amount, decimals)), 'amount')}
                </Text>
                {shouldDisplayAPY && (
                  <Text
                    style={getColumnStyle(0.55)}
                    fontSize={rowFontSize}
                    weight="semiBold"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {additionalData?.APY
                      ? `${formatDecimals(additionalData?.APY, 'amount')}%`
                      : 'N/A'}
                  </Text>
                )}
                <Text
                  style={[getColumnStyle(0.75), text.right]}
                  fontSize={rowFontSize}
                  weight="semiBold"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {formatDecimals(value, 'value')}
                </Text>
              </View>
            )
          }
        )}
      </View>
    </View>
  )
}

export default React.memo(DeFiPositionAssets)

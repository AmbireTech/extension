import { formatUnits } from 'ethers'
import React, { FC, useMemo } from 'react'
import { View } from 'react-native'

import { Position } from '@ambire-common/libs/defiPositions/types'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import DeFiPositionAssetsHeader from './DeFiPositionAssetsHeader'

const COLUMNS = [
  { label: 'AMOUNT', flex: 1 },
  { label: 'USD VALUE', flex: 0.5 }
]

const COLUMNS_WITH_APY = [
  { label: 'AMOUNT', flex: 1 },
  { label: 'APY', flex: 0.5 },
  { label: 'USD VALUE', flex: 0.5 }
]

const DeFiPositionAssets: FC<{
  assets: Position['assets']
  label: string
  chainId: bigint
}> = ({ assets, label, chainId }) => {
  const shouldDisplayAPY = assets.some((a) => !!a?.additionalData?.APY)

  const columns = useMemo(() => {
    return [
      {
        label,
        flex: 1
      },
      ...(shouldDisplayAPY ? COLUMNS_WITH_APY : COLUMNS)
    ]
  }, [label, shouldDisplayAPY])

  return (
    <View>
      <DeFiPositionAssetsHeader columns={columns} />
      <View style={spacings.ptMi}>
        {assets.map(({ symbol, amount, decimals, address, additionalData, value, iconUrl }) => {
          return (
            <View
              style={[flexbox.directionRow, spacings.phSm, spacings.pvTy, flexbox.alignCenter]}
              key={address}
            >
              <View style={[flexbox.directionRow, flexbox.flex1, flexbox.alignCenter]}>
                <TokenIcon
                  width={24}
                  height={24}
                  uri={iconUrl}
                  withContainer={false}
                  chainId={chainId}
                  address={address}
                  withNetworkIcon={false}
                />
                <Text fontSize={14} weight="semiBold" style={spacings.mlTy}>
                  {symbol}
                </Text>
              </View>
              <Text style={flexbox.flex1} fontSize={14} weight="semiBold">
                {formatDecimals(Number(formatUnits(amount, decimals)), 'amount')}
              </Text>
              {shouldDisplayAPY && (
                <Text style={{ flex: 0.5 }} fontSize={14} weight="semiBold">
                  {additionalData?.APY
                    ? `${formatDecimals(additionalData?.APY, 'amount')}%`
                    : 'N/A'}
                </Text>
              )}
              <Text style={{ flex: 0.5, ...text.right }} fontSize={14} weight="semiBold">
                {formatDecimals(value, 'value')}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

export default React.memo(DeFiPositionAssets)

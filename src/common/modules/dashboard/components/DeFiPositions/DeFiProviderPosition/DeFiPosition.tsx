import React, { FC, useMemo } from 'react'
import { View } from 'react-native'

import { AssetType, Position, PositionsByProvider } from '@ambire-common/libs/defiPositions/types'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_MI } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import DeFiPositionAssets from './DeFiPositionAssets'
import Badge from './DeFiPositionHeader/Badge'

type Props = Omit<PositionsByProvider, 'iconUrl' | 'positions' | 'positionInUSD' | 'source'> &
  Position & {
    positionInUSD?: string
    withTopBorder?: boolean
  }

const ASSET_TYPE_TO_LABEL = {
  [AssetType.Borrow]: 'BORROWED',
  [AssetType.Collateral]: 'COLLATERAL',
  [AssetType.Liquidity]: 'SUPPLIED',
  [AssetType.Reward]: 'REWARDS'
}

const DeFiPosition: FC<Props> = ({
  withTopBorder,
  chainId,
  positionInUSD,
  additionalData,
  assets
}) => {
  const { inRange, name, positionIndex, description } = additionalData
  const suppliedAssets = assets.filter(
    (asset) => asset.type === AssetType.Liquidity || asset.type === AssetType.Collateral
  )
  const borrowedAssets = assets.filter((asset) => asset.type === AssetType.Borrow)

  const rewardAssets = assets.filter((asset) => asset.type === AssetType.Reward)

  const { theme } = useTheme()

  const descriptionWithFallback = useMemo(() => {
    try {
      if (description) return description

      if (Number(positionIndex)) return `#${positionIndex}`
      return positionIndex
    } catch (error) {
      return positionIndex
    }
  }, [description, positionIndex])

  return (
    <View
      style={[
        spacings.mhTy,
        spacings.mvMi,
        {
          borderRadius: 8,
          borderWidth: 1,
          borderColor: theme.neutral400,
          backgroundColor: theme.primaryBackground
        }
      ]}
    >
      <View
        style={[
          flexbox.directionRow,
          spacings.phSm,
          spacings.pvSm,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween
        ]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
          <View>
            <Text fontSize={14} weight="semiBold">
              {name}
            </Text>
          </View>
          {!!positionIndex && (
            <Text
              fontSize={12}
              appearance="secondaryText"
              style={[spacings.mlMi, spacings.mrTy]}
              selectable
              numberOfLines={1}
            >
              {descriptionWithFallback}
            </Text>
          )}
          {typeof inRange === 'boolean' && (
            <Badge
              text={inRange ? 'In Range' : 'Out of Range'}
              type={inRange ? 'success' : 'error'}
            />
          )}
        </View>
        <Text fontSize={14} weight="semiBold" style={spacings.ml}>
          {positionInUSD || '$-'}
        </Text>
      </View>
      {suppliedAssets.length > 0 && (
        <DeFiPositionAssets
          chainId={chainId}
          assets={suppliedAssets}
          label={ASSET_TYPE_TO_LABEL[AssetType.Liquidity]}
        />
      )}
      {borrowedAssets.length > 0 && (
        <DeFiPositionAssets
          chainId={chainId}
          assets={borrowedAssets}
          label={ASSET_TYPE_TO_LABEL[AssetType.Borrow]}
        />
      )}
      {rewardAssets.length > 0 && (
        <DeFiPositionAssets
          chainId={chainId}
          assets={rewardAssets}
          label={ASSET_TYPE_TO_LABEL[AssetType.Reward]}
        />
      )}
    </View>
  )
}

export default React.memo(DeFiPosition)

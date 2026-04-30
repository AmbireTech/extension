import React, { FC, useMemo } from 'react'
import { Linking, Pressable, View } from 'react-native'

import { AssetType, Position, PositionsByProvider } from '@ambire-common/libs/defiPositions/types'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_MI } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { generatePositionUrl } from '@common/utils/generatePositionUrl'

import DeFiPositionAssets from './DeFiPositionAssets'
import Badge from './DeFiPositionHeader/Badge'

type Props = Omit<PositionsByProvider, 'iconUrl' | 'positions' | 'positionInUSD' | 'source'> &
  Position & {
    providerName: string
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
  assets,
  providerName,
  siteUrl
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

  const positionUrl = useMemo(
    () =>
      generatePositionUrl({
        providerName,
        positionId: positionIndex,
        chainId,
        siteUrl
      }),
    [providerName, positionIndex, chainId, siteUrl]
  )

  return (
    <View
      style={{
        borderTopWidth: withTopBorder ? 1 : 0,
        borderTopColor: theme.secondaryBorder,
        paddingBottom: !withTopBorder ? SPACING_MI : 0
      }}
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
            <Pressable
              disabled={!positionUrl}
              onPress={positionUrl ? () => Linking.openURL(positionUrl) : undefined}
              style={[spacings.mlMi, spacings.mrTy]}
            >
              <Text
                fontSize={12}
                appearance="secondaryText"
                selectable
                numberOfLines={1}
                style={positionUrl ? { textDecorationLine: 'underline' } : undefined}
              >
                {descriptionWithFallback}
              </Text>
            </Pressable>
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

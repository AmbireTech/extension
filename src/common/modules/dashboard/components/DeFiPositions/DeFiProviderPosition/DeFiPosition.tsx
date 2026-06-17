import React, { FC, useMemo } from 'react'
import { Pressable, View } from 'react-native'

import {
  AssetType,
  Position,
  PositionAsset,
  PositionsByProvider
} from '@ambire-common/libs/defiPositions/types'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import PerpDetails from '@common/modules/dashboard/components/DeFiPositions/DeFiProviderPosition/PerpDetails'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { generatePositionUrl } from '@common/utils/generatePositionUrl'
import { openInTab } from '@common/utils/links'

import DeFiPositionAssets from './DeFiPositionAssets'
import Badge from './DeFiPositionHeader/Badge'

type Props = Omit<PositionsByProvider, 'iconUrl' | 'positions' | 'positionInUSD' | 'source'> &
  Position & {
    providerName: string
    positionInUSD?: string
  }

const ASSET_TYPE_TO_LABEL = {
  [AssetType.Borrow]: 'BORROWED',
  [AssetType.Collateral]: 'COLLATERAL',
  [AssetType.Liquidity]: 'SUPPLIED',
  [AssetType.Reward]: 'REWARDS',
  [AssetType.Margin]: 'MARGIN',
  [AssetType.Perpetual]: 'POSITION',
  [AssetType.Prediction]: 'PREDICTION'
}

// Both Liquidity and Collateral are considered supplied assets, so we group them together for better display in the UI
const getMappedType = (type: AssetType) => {
  if (type === AssetType.Collateral) return AssetType.Liquidity

  return type
}

const DeFiPosition: FC<Props> = ({
  chainId,
  positionInUSD,
  additionalData,
  assets,
  providerName,
  siteUrl
}) => {
  const { inRange, name, positionIndex, description } = additionalData

  const assetsByType = useMemo(() => {
    return assets.reduce(
      (acc, asset) => {
        let type = getMappedType(asset.type)

        if (!acc[type]) acc[type] = []

        acc[type].push(asset)

        return acc
      },
      {} as Record<AssetType, PositionAsset[]>
    )
  }, [assets])

  const { theme } = useTheme()

  const descriptionWithFallback = useMemo(() => {
    try {
      if (description) return description

      if (Number(positionIndex)) return `#${positionIndex}`
      return positionIndex
    } catch (error: any) {
      console.error('Error parsing position description', error)
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
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.flex1,
            { minWidth: 0, flexShrink: 1 }
          ]}
        >
          <Text fontSize={14} weight="semiBold" style={{ flexShrink: 0 }}>
            {name}
          </Text>
          {!!positionIndex && (
            <Pressable
              disabled={!positionUrl}
              onPress={positionUrl ? () => openInTab({ url: positionUrl }) : undefined}
              style={[{ flex: 1, minWidth: 0, flexShrink: 1 }, spacings.mlMi, spacings.mrTy]}
            >
              <Text
                fontSize={12}
                appearance="secondaryText"
                selectable
                numberOfLines={1}
                style={positionUrl ? { textDecorationLine: 'underline' } : undefined}
                ellipsizeMode="tail"
              >
                {descriptionWithFallback}
              </Text>
            </Pressable>
          )}
          {typeof inRange === 'boolean' && (
            <Badge
              text={inRange ? 'In Range' : 'Out of Range'}
              type={inRange ? 'success' : 'error'}
              style={{ flexShrink: 0 }}
            />
          )}
        </View>
        <Text fontSize={14} weight="semiBold" style={[spacings.ml, { flexShrink: 0 }]}>
          {positionInUSD || '$-'}
        </Text>
      </View>
      <PerpDetails additionalData={additionalData} />
      {(Object.entries(assetsByType) as unknown as [AssetType, PositionAsset[]][]).map(
        ([type, assetsOfType]) =>
          ASSET_TYPE_TO_LABEL[getMappedType(type)] && (
            <DeFiPositionAssets
              key={type}
              chainId={chainId}
              assets={assetsOfType}
              label={ASSET_TYPE_TO_LABEL[getMappedType(type)]}
            />
          )
      )}
    </View>
  )
}

export default React.memo(DeFiPosition)

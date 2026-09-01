import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { CustomToken } from '@ambire-common/libs/portfolio/customToken'
import { CollectionResult, TokenResult } from '@ambire-common/libs/portfolio/interfaces'
import { ManagedAsset } from '@common/modules/settings/hooks/useManageAssets/useManageAssets'
import Text from '@common/components/Text'
import { ASSET_COPY } from '@common/modules/settings/constants/assetCopy'
import { ALL_NETWORKS_FILTER } from '@common/modules/settings/hooks/useManageAssets'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'
import { getTokenId } from '@common/utils/token'

import AssetListHeader from './AssetListHeader'
import AssetRow from './AssetRow'
import Skeletons from './Skeletons'

type Props = {
  standard: CustomToken['standard']
  variant: 'custom' | 'hidden'
  isLoading: boolean
  data: ManagedAsset<TokenResult | CollectionResult>[]
  networkFilter: string
  search: string
}

const AssetSection: FC<Props> = ({ standard, variant, isLoading, data, networkFilter, search }) => {
  const { t } = useTranslation()
  const copy = ASSET_COPY[standard]

  const emptyText = useMemo(() => {
    const emptyCopy = variant === 'custom' ? copy.emptyCustom : copy.emptyHidden
    const hasNetworkFilter = networkFilter !== ALL_NETWORKS_FILTER

    if (search && hasNetworkFilter) return t(emptyCopy.searchAndNetwork)

    if (search) return t(emptyCopy.search)

    if (hasNetworkFilter) return t(emptyCopy.network)

    return t(emptyCopy.noFilters)
  }, [copy, networkFilter, search, t, variant])

  return (
    <View style={[variant === 'custom' && spacings.mbLg]}>
      <Text fontSize={16} weight="medium" style={spacings.mbTy}>
        {t(variant === 'custom' ? copy.customSectionTitle : copy.hiddenSectionTitle)}
      </Text>
      <AssetListHeader assetLabel={copy.listColumn} />
      {!isLoading && !data.length && (
        <Text
          testID="you-dont-have-any-text"
          appearance="secondaryText"
          fontSize={16}
          style={[spacings.mt2Xl, text.center]}
          weight="medium"
        >
          {emptyText}
        </Text>
      )}
      {!isLoading &&
        data.map((asset) => <AssetRow key={getTokenId(asset)} asset={asset} standard={standard} />)}
      {isLoading && <Skeletons />}
    </View>
  )
}

export default AssetSection

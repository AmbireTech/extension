import React, { FC } from 'react'
import { View } from 'react-native'

import { CustomToken } from '@ambire-common/libs/portfolio/customToken'
import { CollectionResult, TokenResult } from '@ambire-common/libs/portfolio/interfaces'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { ASSET_COPY } from '@common/modules/settings/constants/assetCopy'
import spacings from '@common/styles/spacings'
import { getTokenId } from '@common/utils/token'

import AssetRow from './AssetRow'

const SKELETONS_TO_DISPLAY = 2

type Props = {
  standard: CustomToken['standard']
  variant: 'custom' | 'hidden'
  isLoading: boolean
  data: (TokenResult | CollectionResult)[]
}

const AssetSection: FC<Props> = ({ standard, variant, isLoading, data }) => {
  const { t } = useTranslation()
  const copy = ASSET_COPY[standard]

  return (
    <View style={variant === 'custom' ? spacings.mbLg : undefined}>
      <Text fontSize={16} weight="medium" style={spacings.mbTy}>
        {t(variant === 'custom' ? copy.customSectionTitle : copy.hiddenSectionTitle)}
      </Text>
      {isLoading
        ? Array.from({ length: SKELETONS_TO_DISPLAY }, (_, index) => (
            <SkeletonLoader
              key={`${standard}-${variant}-skeleton-${index.toString()}`}
              height={56}
              width="100%"
              style={spacings.mbTy}
              appearance="secondaryBackground"
            />
          ))
        : data.map((asset) => (
            <AssetRow key={getTokenId(asset)} asset={asset} standard={standard} />
          ))}
    </View>
  )
}

export default React.memo(AssetSection)

import React, { FC } from 'react'
import { View } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import { getTokenId } from '@common/utils/token'

import Token from './Token'

const SKELETONS_TO_DISPLAY = 2

type Props = {
  variant: 'custom' | 'hidden'
  isLoading: boolean
  data: TokenResult[]
  onTokenPreferenceOrCustomTokenChange: () => void
}

const TokenSection: FC<Props> = ({
  variant,
  isLoading,
  data,
  onTokenPreferenceOrCustomTokenChange
}) => {
  const { t } = useTranslation()

  return (
    <View style={variant === 'custom' ? spacings.mbLg : undefined}>
      <Text fontSize={16} weight="medium" style={spacings.mbTy}>
        {t(variant === 'custom' ? 'Custom tokens' : 'Hidden tokens')}
      </Text>
      {isLoading
        ? Array.from({ length: SKELETONS_TO_DISPLAY }, (_, index) => (
            <SkeletonLoader
              key={`${variant}-skeleton-${index.toString()}`}
              height={56}
              width="100%"
              style={spacings.mbTy}
              appearance="secondaryBackground"
            />
          ))
        : data.map((token) => (
            <Token
              key={getTokenId(token)}
              token={token}
              onTokenPreferenceOrCustomTokenChange={onTokenPreferenceOrCustomTokenChange}
            />
          ))}
    </View>
  )
}

export default React.memo(TokenSection)

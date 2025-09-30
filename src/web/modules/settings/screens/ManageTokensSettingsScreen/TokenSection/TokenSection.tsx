import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'
import { getTokenId } from '@web/utils/token'

import Skeletons from './Skeletons'
import Token from './Token/Token'
import TokenListHeader from './TokenListHeader'

type Props = {
  variant: 'custom' | 'hidden'
  isLoading: boolean
  data: TokenResult[]
  onTokenPreferenceOrCustomTokenChange: () => void
  networkFilter: string
  search: string
}

const TokenSection: FC<Props> = ({
  variant,
  isLoading,
  data,
  onTokenPreferenceOrCustomTokenChange,
  networkFilter,
  search
}) => {
  const { t } = useTranslation()
  const emptyText = useMemo(() => {
    const prefix = `${variant} `
    const hasNetworkFilter = networkFilter !== 'all'

    if (search && hasNetworkFilter) {
      return t(`No ${prefix}tokens found for these filters`)
    }

    if (!search && !hasNetworkFilter) {
      return t(`You don't have any ${prefix}tokens`)
    }

    if (search && !hasNetworkFilter) {
      return t(`No ${prefix}tokens found`)
    }

    if (!search && hasNetworkFilter) {
      return t(`No ${prefix}tokens found on this network`)
    }

    return t(`No ${prefix}tokens found`)
  }, [networkFilter, search, t, variant])

  return (
    <View style={[variant === 'custom' && spacings.mbLg]}>
      <Text fontSize={16} weight="medium" style={spacings.mbTy}>
        {t(variant === 'custom' ? 'Custom Tokens' : 'Hidden Tokens')}
      </Text>
      <TokenListHeader />
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
        data.map((token) => (
          <Token
            key={getTokenId(token)}
            onTokenPreferenceOrCustomTokenChange={onTokenPreferenceOrCustomTokenChange}
            {...token}
          />
        ))}
      {isLoading && <Skeletons />}
    </View>
  )
}

export default TokenSection

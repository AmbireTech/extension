import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { TrendingToken } from '@ambire-common/interfaces/dapp'
import FireIcon from '@common/assets/svg/FireIcon'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'

import SectionHeader from '../SectionHeader'
import TrendingTokenItem from '../TrendingTokenItem'

const MAX_TRENDING_TOKENS_ON_EXPLORE = 3

const TrendingSection = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { state } = useController('DappsController')

  const trendingTokens: TrendingToken[] = useMemo(
    () => (state.trendingTokens || []).slice(0, MAX_TRENDING_TOKENS_ON_EXPLORE),
    [state.trendingTokens]
  )

  const handleSeeAll = useCallback(() => navigate(ROUTES.trendingTokens), [navigate])

  if (!trendingTokens.length) return null

  return (
    <View style={spacings.mbSm}>
      <SectionHeader
        icon={<FireIcon width={20} height={20} />}
        title={t('Trending')}
        onPress={handleSeeAll}
      />
      {trendingTokens.map((token) => (
        <TrendingTokenItem key={token.id} token={token} />
      ))}
    </View>
  )
}

export default React.memo(TrendingSection)

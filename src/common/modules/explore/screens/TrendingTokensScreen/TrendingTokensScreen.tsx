import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { TrendingToken } from '@ambire-common/interfaces/dapp'
import LayoutWrapper from '@common/components/LayoutWrapper'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import TrendingTokenItem from '@common/modules/explore/components/TrendingTokenItem'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

const TrendingTokensScreen = () => {
  const { t } = useTranslation()
  const { state } = useController('DappsController')

  const renderItem = useCallback(
    ({ item }: { item: TrendingToken }) => <TrendingTokenItem token={item} />,
    []
  )

  return (
    <LayoutWrapper>
      <HeaderWithTitle title={t('Trending')} />
      <ScrollableWrapper
        type={WRAPPER_TYPES.FLAT_LIST}
        data={(state.trendingTokens || []) as TrendingToken[]}
        renderItem={renderItem as any}
        keyExtractor={(item: TrendingToken) => item.id}
        style={spacings.phSm}
        ListEmptyComponent={
          <View style={[flexbox.center, spacings.pv]}>
            <Text appearance="secondaryText" style={text.center}>
              {t('No trending tokens found')}
            </Text>
          </View>
        }
      />
    </LayoutWrapper>
  )
}

export default React.memo(TrendingTokensScreen)

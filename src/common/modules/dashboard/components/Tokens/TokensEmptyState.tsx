import React from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  searchValue: string
  dashboardNetworkFilterName: string | null
}

const TokensEmptyState = ({ searchValue, dashboardNetworkFilterName }: Props) => {
  const { t } = useTranslation()

  return (
    <View style={[flexbox.alignCenter, spacings.pv]}>
      <Text testID="no-tokens-text" fontSize={16} weight="medium">
        {!searchValue && !dashboardNetworkFilterName && t("You don't have any tokens yet.")}
        {!searchValue &&
          dashboardNetworkFilterName &&
          t(`No tokens found on ${dashboardNetworkFilterName}.`)}
        {searchValue &&
          t(
            `No tokens match "${searchValue}"${
              dashboardNetworkFilterName ? ` on ${dashboardNetworkFilterName}` : ''
            }.`
          )}
      </Text>
    </View>
  )
}

export default React.memo(TokensEmptyState)

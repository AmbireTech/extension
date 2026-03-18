import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import spacings from '@common/styles/spacings'

import TokenDetailsTitle from '../Title'

const TokenDetailsTransactionHistory = () => {
  const { t } = useTranslation()

  // @TODO: Implement
  return null

  return (
    <View style={spacings.ptLg}>
      <TokenDetailsTitle title={t('Transactions')} />
    </View>
  )
}

export default memo(TokenDetailsTransactionHistory)

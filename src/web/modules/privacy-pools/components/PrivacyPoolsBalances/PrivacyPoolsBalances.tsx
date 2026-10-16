import React, { FC } from 'react'
import { View } from 'react-native'

import { PrivacyPoolsUnavailableReason } from '@ambire-common/interfaces/privacyPools'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import PrivacyPoolsTokenItem from '@web/modules/privacy-pools/components/PrivacyPoolsTokenItem'
import {
  PrivacyPoolsBalanceDisplay,
  PrivacyPoolsBalancesState
} from '@web/modules/privacy-pools/hooks/usePrivacyPools/usePrivacyPools'

import getStyles from './styles'

interface Props {
  balances: PrivacyPoolsBalanceDisplay[]
  state: PrivacyPoolsBalancesState
  /** Why the account cannot use Privacy Pools, explained while the state is 'unavailable'. */
  unavailableReason: PrivacyPoolsUnavailableReason | null
}

const PrivacyPoolsBalances: FC<Props> = ({ balances, state, unavailableReason }) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  const renderNotice = (title: string, text: string) => (
    <View style={styles.container}>
      <View style={styles.emptyContainer}>
        <Text fontSize={14} weight="medium" style={spacings.mbMi}>
          {title}
        </Text>
        <Text fontSize={12} color={theme.secondaryText} style={styles.centeredText}>
          {text}
        </Text>
      </View>
    </View>
  )

  if (state === 'unavailable') {
    // Here and not on the card above, so the card keeps one height like the regular dashboard's
    const reasons: { [reason in PrivacyPoolsUnavailableReason]: string } = {
      'no-account': t('Select a Privacy Pools account to see what it holds.'),
      'unsupported-network': t(
        'Privacy Pools is not available on any of the networks you have added. It runs on Ethereum.'
      ),
      locked: t('Unlock your wallet to see what you have in Privacy Pools.')
    }

    return renderNotice(
      t('Nothing to show'),
      unavailableReason
        ? reasons[unavailableReason]
        : t("Privacy Pools can't be used with this account right now.")
    )
  }

  if (state === 'not-loaded')
    return renderNotice(
      t('Nothing has been checked yet'),
      t('Once a network is checked, what this account holds on it shows up here.')
    )

  // Only while there are no rows: a later refresh keeps them on screen
  if (state === 'loading' && !balances.length) {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <SkeletonLoader width="100%" height={32} />
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <SkeletonLoader width="100%" height={32} />
        </View>
      </View>
    )
  }

  if (!balances.length)
    return renderNotice(
      t('Nothing in this account yet'),
      t('Send ETH or another supported token to it from any of your other accounts.')
    )

  return (
    <View>
      {balances.map((balance) => (
        <PrivacyPoolsTokenItem key={balance.id} balance={balance} />
      ))}
    </View>
  )
}

export default React.memo(PrivacyPoolsBalances)

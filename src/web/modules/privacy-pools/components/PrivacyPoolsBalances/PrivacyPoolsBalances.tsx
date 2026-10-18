import React, { FC } from 'react'
import { View } from 'react-native'

import { PrivacyPoolsUnavailableReason } from '@ambire-common/interfaces/privacyPools'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import TokensEmptyState from '@common/modules/dashboard/components/Tokens/TokensEmptyState'
import flexbox from '@common/styles/utils/flexbox'
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
  /** Whether reading waits for the recovery phrase backup - see `syncIfStale`. */
  isWaitingForBackup: boolean
  /** Replaces the Privacy Pools reasons, for another provider's account. */
  unavailableText?: string
}

const PrivacyPoolsBalances: FC<Props> = ({
  balances,
  state,
  unavailableReason,
  isWaitingForBackup,
  unavailableText
}) => {
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
      unavailableText ||
        (unavailableReason
          ? reasons[unavailableReason]
          : t("Privacy Pools can't be used with this account right now."))
    )
  }

  // The banner above asks for the backup, this says what it is for
  if (state === 'not-loaded' && isWaitingForBackup)
    return (
      <View style={[flexbox.alignCenter, spacings.pv]}>
        <Text fontSize={16} weight="medium" style={styles.centeredText}>
          {t('Your tokens will show up here once the recovery phrase is backed up.')}
        </Text>
      </View>
    )

  // Only while there are no rows: a later refresh keeps them on screen. Not read yet is the same
  // wait, as the account is read as soon as it opens backed up
  if ((state === 'loading' || state === 'not-loaded') && !balances.length) {
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

  // Like the regular dashboard. The banner above says how to top it up
  if (!balances.length) return <TokensEmptyState searchValue="" dashboardNetworkFilterName={null} />

  return (
    <View>
      {balances.map((balance) => (
        <PrivacyPoolsTokenItem key={balance.id} balance={balance} />
      ))}
    </View>
  )
}

export default React.memo(PrivacyPoolsBalances)

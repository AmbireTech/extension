import React, { FC } from 'react'
import { View } from 'react-native'

import { PrivacyPoolsUnavailableReason } from '@ambire-common/interfaces/privacyPools'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { PrivacyPoolsHistoryListState } from '@web/modules/privacy-pools/hooks/usePrivacyPoolsHistory/usePrivacyPoolsHistory'

import getStyles from './styles'

interface Props {
  listState: Extract<PrivacyPoolsHistoryListState, 'unavailable' | 'waiting-for-backup' | 'empty'>
  /** Why the account cannot use Privacy Pools, explained while the state is 'unavailable'. */
  unavailableReason: PrivacyPoolsUnavailableReason | null
}

/** Stands in for a Privacy Pools account's history when there is none to list. */
const PrivacyPoolsHistoryNotice: FC<Props> = ({ listState, unavailableReason }) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  const getContent = (): { title: string; text: string } => {
    if (listState === 'empty')
      return {
        title: t('No activity yet'),
        text: t('What you send to and from this account will show up here.')
      }

    if (listState === 'waiting-for-backup')
      return {
        title: t('Nothing to show yet'),
        text: t('Your activity will show up here once the recovery phrase is backed up.')
      }

    const reasons: { [reason in PrivacyPoolsUnavailableReason]: string } = {
      'no-account': t('Select a Privacy Pools account to see its activity.'),
      'unsupported-network': t(
        'Privacy Pools is not available on any of the networks you have added. It runs on Ethereum.'
      ),
      locked: t('Unlock your wallet to see your Privacy Pools activity.'),
      'passphrase-needed': t(
        'This account needs its passphrase again. Remove it and add it again with the passphrase - your funds stay where they are.'
      )
    }

    return {
      title: t('Nothing to show'),
      text: unavailableReason
        ? reasons[unavailableReason]
        : t("Privacy Pools can't be used with this account right now.")
    }
  }

  const { title, text } = getContent()

  return (
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
}

export default React.memo(PrivacyPoolsHistoryNotice)

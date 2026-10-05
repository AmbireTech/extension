import React, { FC } from 'react'
import { View } from 'react-native'

import {
  PrivacyPoolsActivityStatus,
  PrivacyPoolsActivityType
} from '@ambire-common/interfaces/privacyPools'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import type { WalletStateController } from '@common/controllers/wallet-state'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { privateValue } from '@common/utils/ui'
import { PrivacyPoolsActivityDisplay } from '@web/modules/privacy-pools/hooks/usePrivacyPools/usePrivacyPools'

import getStyles from './styles'

interface Props {
  activity: PrivacyPoolsActivityDisplay[]
}

const selectIsPrivacyModeEnabled = (state: WalletStateController) => state.isPrivacyModeEnabled

// In wallet terms rather than protocol ones
const TYPE_LABEL: { [type in PrivacyPoolsActivityType]: string } = {
  deposit: 'Received',
  withdraw: 'Sent'
}

const STATUS_LABEL: { [status in PrivacyPoolsActivityStatus]: string } = {
  pending: 'In progress',
  success: 'Done',
  failed: 'Failed'
}

/**
 * This wallet's Privacy Pools activity, kept locally: the chain cannot reconstruct it, as notes
 * have no timestamp or transaction id and a withdrawal's change note looks like a deposit.
 */
const PrivacyPoolsActivity: FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { state: isPrivacyModeEnabled } = useController(
    'WalletStateController',
    selectIsPrivacyModeEnabled
  )

  const getStatusColor = (status: PrivacyPoolsActivityStatus) => {
    if (status === 'pending') return theme.warningText
    if (status === 'failed') return theme.errorText

    return theme.successText
  }

  if (!activity.length) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text fontSize={14} weight="medium" style={spacings.mbMi}>
            {t('No activity yet')}
          </Text>
          <Text fontSize={12} color={theme.secondaryText} style={styles.centeredText}>
            {t('What you send to and from this account shows up in this list.')}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {activity.map((entry, index) => (
        <View
          key={entry.id}
          style={[styles.row, index === activity.length - 1 && { borderBottomWidth: 0 }]}
        >
          <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
            <TokenIcon
              chainId={BigInt(entry.chainId)}
              address={entry.tokenAddress}
              withNetworkIcon
              width={32}
              height={32}
            />
            <View style={[flexbox.flex1, spacings.mlSm]}>
              <Text fontSize={14} weight="medium" numberOfLines={1}>
                {`${t(TYPE_LABEL[entry.type])} · ${entry.networkName}`}
              </Text>
              <Text fontSize={12} color={theme.secondaryText} numberOfLines={1}>
                {new Date(entry.createdAt).toLocaleDateString()}
                {` (${new Date(entry.createdAt).toLocaleTimeString()})`}
                {!!entry.recipient && ` · ${t('to')} ${shortenAddress(entry.recipient, 16)}`}
              </Text>
            </View>
          </View>
          <View style={[flexbox.alignEnd, spacings.mlSm]}>
            <Text fontSize={14} weight="number_regular" numberOfLines={1}>
              {`${privateValue(
                formatDecimals(Number(entry.amount), 'amount'),
                isPrivacyModeEnabled
              )} ${entry.symbol}`}
            </Text>
            <Text fontSize={12} color={getStatusColor(entry.status)} numberOfLines={1}>
              {t(STATUS_LABEL[entry.status])}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}

export default React.memo(PrivacyPoolsActivity)

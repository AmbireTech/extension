import React, { FC } from 'react'
import { View } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Badge from '@common/components/Badge'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import type { WalletStateController } from '@common/controllers/wallet-state'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { privateValue } from '@common/utils/ui'
import {
  PrivacyPoolsBalanceDisplay,
  PrivacyPoolsBalancesState
} from '@web/modules/privacy-pools/hooks/usePrivacyPools/usePrivacyPools'

import getStyles from './styles'

interface Props {
  balances: PrivacyPoolsBalanceDisplay[]
  state: PrivacyPoolsBalancesState
}

const selectIsPrivacyModeEnabled = (state: WalletStateController) => state.isPrivacyModeEnabled

const PrivacyPoolsBalances: FC<Props> = ({ balances, state }) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { state: isPrivacyModeEnabled } = useController(
    'WalletStateController',
    selectIsPrivacyModeEnabled
  )

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

  if (state === 'unavailable')
    return renderNotice(
      t('Nothing to show'),
      t("The card above explains why Privacy Pools can't be used with this account.")
    )

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
    <View style={styles.container}>
      {balances.map((balance, index) => (
        <View
          key={balance.id}
          style={[styles.row, index === balances.length - 1 && { borderBottomWidth: 0 }]}
        >
          <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
            {/* The network badge identifies the pool, like on the dashboard's token list */}
            <TokenIcon
              chainId={BigInt(balance.chainId)}
              address={balance.tokenAddress}
              withNetworkIcon
              width={32}
              height={32}
            />
            <View style={[flexbox.flex1, spacings.mlSm]}>
              <Text fontSize={14} weight="medium" numberOfLines={1}>
                {balance.symbol}
              </Text>
              <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.wrap]}>
                <Text fontSize={12} color={theme.secondaryText} numberOfLines={1}>
                  {balance.networkName}
                </Text>
                {/* Like the regular dashboard's pending balance badge */}
                {balance.isReadyToSend && (
                  <Badge
                    text={t('Ready to send')}
                    type="success"
                    size="sm"
                    style={spacings.mlTy}
                    tooltipText={t(
                      'Privacy Pools has approved these funds, so they can be sent on.'
                    )}
                  />
                )}
                {!!balance.pendingAmount && (
                  <Badge
                    text={t('Under review')}
                    type="warning"
                    size="sm"
                    style={spacings.mlTy}
                    tooltipText={t(
                      'Privacy Pools checks every transfer into it before the funds can be sent on. This can take a while.'
                    )}
                  />
                )}
              </View>
            </View>
          </View>
          <View style={[flexbox.alignEnd, spacings.mlSm]}>
            <Text fontSize={14} weight="number_regular" numberOfLines={1}>
              {privateValue(
                formatDecimals(Number(balance.approvedAmount), 'amount'),
                isPrivacyModeEnabled
              )}
            </Text>
            {balance.value !== null && (
              <Text
                fontSize={12}
                weight="number_regular"
                color={theme.secondaryText}
                numberOfLines={1}
              >
                {privateValue(formatDecimals(balance.value, 'value'), isPrivacyModeEnabled, 8)}
              </Text>
            )}
            {/* Not in the amount above: until approved, a deposit can only be taken back
            publicly by its depositor */}
            {!!balance.pendingAmount && (
              <Text fontSize={12} color={theme.warningText} numberOfLines={1}>
                {t('+{{amount}} waiting for approval', {
                  amount: privateValue(
                    formatDecimals(Number(balance.pendingAmount), 'amount'),
                    isPrivacyModeEnabled
                  )
                })}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  )
}

export default React.memo(PrivacyPoolsBalances)

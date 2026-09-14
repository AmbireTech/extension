import React, { FC } from 'react'
import { View } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  PrivacyPoolsBalanceDisplay,
  PrivacyPoolsBalancesState
} from '@web/modules/privacy-pools/hooks/usePrivacyPools/usePrivacyPools'

import getStyles from './styles'

interface Props {
  balances: PrivacyPoolsBalanceDisplay[]
  state: PrivacyPoolsBalancesState
}

const PrivacyPoolsBalances: FC<Props> = ({ balances, state }) => {
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

  if (state === 'unavailable')
    return renderNotice(
      t('Nothing to show'),
      t("The card above explains why Privacy Pools can't be used with this account.")
    )

  if (state === 'not-loaded')
    return renderNotice(
      t('Nothing has been checked yet'),
      t('Check a network above, and whatever you have in its pools shows up here.')
    )

  // Placeholders rather than an empty list, and only while nothing has been read yet: once there
  // are rows, a later refresh keeps them on screen instead of swapping content in and out.
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
      t('Nothing in the pools yet'),
      t('Deposit some ETH to start building a private balance.')
    )

  return (
    <View style={styles.container}>
      {balances.map((balance, index) => (
        <View
          key={balance.id}
          style={[styles.row, index === balances.length - 1 && { borderBottomWidth: 0 }]}
        >
          <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
            {/* The network badge is what identifies the pool a balance sits in, now that the list
            spans every supported network - same as the dashboard's token list. */}
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
              <Text fontSize={12} color={theme.secondaryText} numberOfLines={1}>
                {balance.networkName}
              </Text>
            </View>
          </View>
          <View style={[flexbox.alignEnd, spacings.mlSm]}>
            <Text fontSize={14} weight="number_regular" numberOfLines={1}>
              {formatDecimals(Number(balance.approvedAmount), 'amount')}
            </Text>
            {balance.value !== null && (
              <Text
                fontSize={12}
                weight="number_regular"
                color={theme.secondaryText}
                numberOfLines={1}
              >
                {formatDecimals(balance.value, 'value')}
              </Text>
            )}
            {/* Not added to the amount above: until the association set approves a deposit it can
            only be taken back publicly, to the address that made it - which is not a private
            balance in any useful sense. */}
            {!!balance.pendingAmount && (
              <Text fontSize={12} color={theme.warningText} numberOfLines={1}>
                {t('+{{amount}} waiting for approval', {
                  amount: formatDecimals(Number(balance.pendingAmount), 'amount')
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

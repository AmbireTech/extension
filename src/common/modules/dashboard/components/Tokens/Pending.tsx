import { UsePrivateModeReturnType } from 'ambire-common/src/hooks/usePrivateMode'
import { formatFloatTokenAmount } from 'ambire-common/src/services/formatter'
import React from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'

import styles from './styles'

interface Props {
  hidePrivateValue: UsePrivateModeReturnType['hidePrivateValue']
  decimals: number
  balance: number
  latest: { balance: number }
  pending: { balanceIncrease: number; difference: number }
  unconfirmed: { balanceIncrease: number; difference: number }
}

const Pending = ({ hidePrivateValue, decimals, pending, unconfirmed, latest }: Props) => {
  const { t } = useTranslation()

  return unconfirmed || pending ? (
    <View style={styles.pendingContainer}>
      <View style={styles.pendingContainerWrapper}>
        {pending ? (
          <View style={styles.pendingItem}>
            <Text style={styles.pendingBalance} fontSize={11}>
              {hidePrivateValue(
                pending.balanceIncrease
                  ? `+${Math.abs(pending.difference).toFixed(5)}`
                  : `-${Math.abs(pending.difference).toFixed(5)}`
              )}{' '}
              {t('Pending transaction confirmation')}
            </Text>
          </View>
        ) : null}
        {unconfirmed ? (
          <View style={styles.pendingItem}>
            <Text style={styles.pendingBalance} fontSize={11}>
              {hidePrivateValue(
                unconfirmed.balanceIncrease
                  ? `+${Math.abs(unconfirmed.difference).toFixed(5)}`
                  : `-${Math.abs(unconfirmed.difference).toFixed(5)}`
              )}{' '}
              {t('Pending transaction signature')}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.pendingContainerWrapper}>
        <Text style={styles.onChainBalance} fontSize={12}>
          {hidePrivateValue(
            formatFloatTokenAmount(
              latest?.balance ? Number(latest?.balance).toFixed(latest?.balance < 1 ? 8 : 4) : 0,
              true,
              decimals
            )
          )}{' '}
          ({t('On-chain')})
        </Text>
      </View>
    </View>
  ) : null
}

export default React.memo(Pending)

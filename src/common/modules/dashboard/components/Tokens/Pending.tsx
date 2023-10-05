import { UsePrivateModeReturnType } from 'ambire-common/src/hooks/usePrivateMode'
import { formatFloatTokenAmount } from 'ambire-common/src/services/formatter'
import React from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'

interface Props {
  hidePrivateValue: UsePrivateModeReturnType['hidePrivateValue']
  decimals: number
  latest: { balance: number }
  pending: { balanceIncrease: number; difference: number }
  unconfirmed: { balanceIncrease: number; difference: number }
}
const Pending = ({ hidePrivateValue, decimals, pending, unconfirmed, latest }: Props) => {
  return unconfirmed || pending ? (
    <View>
      <View>
        {pending ? (
          <Text>
            {hidePrivateValue(
              pending.balanceIncrease
                ? `+${Math.abs(pending.difference).toFixed(5)}`
                : `-${Math.abs(pending.difference).toFixed(5)}`
            )}{' '}
            Pending transaction confirmation
          </Text>
        ) : null}
        {unconfirmed ? (
          <Text>
            {hidePrivateValue(
              unconfirmed.balanceIncrease
                ? `+${Math.abs(unconfirmed.difference).toFixed(5)}`
                : `-${Math.abs(unconfirmed.difference).toFixed(5)}`
            )}{' '}
            Pending transaction signature
          </Text>
        ) : null}
      </View>
      <Text>
        <Text>
          {hidePrivateValue(
            formatFloatTokenAmount(
              latest?.balance ? Number(latest?.balance).toFixed(latest?.balance < 1 ? 8 : 4) : 0,
              true,
              decimals
            )
          )}
        </Text>{' '}
        (On-chain)
      </Text>
    </View>
  ) : null
}

export default React.memo(Pending)

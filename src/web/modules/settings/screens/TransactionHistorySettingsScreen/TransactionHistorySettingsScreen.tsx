import { nanoid } from 'nanoid'
import React, { FC, useState } from 'react'
import { Trans } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Network } from '@ambire-common/interfaces/network'
import { SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import HistorySettingsPage from '../../../../../common/modules/settings/components/TransactionHistory/HistorySettingsPage'
import SubmittedTransactionSummary from '../../../../../common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary'

const AccountOpHistory: FC<{ network?: Network; account: Account; sessionId: string }> = ({
  network,
  account,
  sessionId
}) => {
  const activityState = useController('ActivityController').state
  const items = activityState?.accountsOps?.[sessionId]?.result?.items || []

  if (!items.length) {
    return (
      <View
        style={[StyleSheet.absoluteFill, flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}
      >
        <Trans>
          <Text style={text.center}>
            <Text fontSize={16}>{'No transactions history for\n'}</Text>
            <Text fontSize={16} weight="medium">
              {`${account.preferences.label} (${shortenAddress(account.addr, 10)})`}
            </Text>
            <Text fontSize={16}>{' on '}</Text>
            <Text fontSize={16} weight="medium">
              {network?.name}
            </Text>
          </Text>
        </Trans>
      </View>
    )
  }

  return (
    <>
      {items.map((item: SubmittedAccountOp, i) => (
        <SubmittedTransactionSummary
          key={item.txnId}
          size="md"
          defaultType="full-info"
          submittedAccountOp={item}
          style={i !== items.length - 1 ? spacings.mbLg : {}}
        />
      ))}
    </>
  )
}

const TransactionHistorySettingsScreen = () => {
  const [sessionId] = useState(nanoid())

  return (
    <HistorySettingsPage
      historyType="transactions"
      HistoryComponent={AccountOpHistory}
      sessionId={sessionId}
    />
  )
}

export default TransactionHistorySettingsScreen

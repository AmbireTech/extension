import React, { FC } from 'react'
import { Trans } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

import { SignedMessage } from '@ambire-common/controllers/activity/activity'
import { Account } from '@ambire-common/interfaces/account'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import useActivityControllerState from '@web/hooks/useActivityControllerState'
import shortenAddress from '@web/utils/shortenAddress'

import HistorySettingsPage from '../../components/TransactionHistory/HistorySettingsPage'
import SignedMessageSummary from '../../components/TransactionHistory/SignedMessageSummary'

const SignedMessageHistory: FC<{
  page?: number
  account: Account
}> = ({ page, account }) => {
  const activityState = useActivityControllerState()

  if (!activityState?.signedMessages?.items?.length && page) {
    return (
      <View
        style={[StyleSheet.absoluteFill, flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}
      >
        <Trans>
          <Text style={text.center}>
            <Text fontSize={16}>{'No signed messages history for\n'}</Text>
            <Text fontSize={16} weight="medium">
              {`${account.preferences.label} (${shortenAddress(account.addr, 10)})`}
            </Text>
            {page > 1 ? (
              <>
                <Text>{' on page: '}</Text>
                <Text fontSize={16} weight="medium">
                  {page}
                </Text>
              </>
            ) : (
              ''
            )}
          </Text>
        </Trans>
      </View>
    )
  }

  return (
    <>
      {(activityState?.signedMessages?.items || []).map((item, i) => (
        <SignedMessageSummary
          key={item.id}
          signedMessage={item as SignedMessage}
          style={i !== activityState.signedMessages!.items.length - 1 ? spacings.mbSm : {}}
        />
      ))}
    </>
  )
}

const SignedMessageHistorySettingsScreen = () => {
  return <HistorySettingsPage historyType="messages" HistoryComponent={SignedMessageHistory} />
}

export default SignedMessageHistorySettingsScreen

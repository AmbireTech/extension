import { nanoid } from 'nanoid'
import React, { FC, useState } from 'react'
import { Trans } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

import { SignedMessage } from '@ambire-common/controllers/activity/types'
import { Account } from '@ambire-common/interfaces/account'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import HistorySettingsPage from '../../components/TransactionHistory/HistorySettingsPage'
import SignedMessageSummary from '../../components/TransactionHistory/SignedMessageSummary'

const SignedMessageHistory: FC<{
  page?: number
  account: Account
  sessionId: string
}> = ({ page, account, sessionId }) => {
  const activityState = useController('ActivityController').state

  if (!activityState?.signedMessages?.[sessionId]?.result.items.length && page) {
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
      {(activityState?.signedMessages?.[sessionId]?.result.items || []).map((item, i) => (
        <SignedMessageSummary
          key={item.timestamp}
          signedMessage={item as SignedMessage}
          style={
            i !== activityState.signedMessages[sessionId].result.items.length - 1
              ? spacings.mbSm
              : {}
          }
        />
      ))}
    </>
  )
}

const SignedMessageHistorySettingsScreen = () => {
  const [sessionId] = useState(nanoid())
  return (
    <HistorySettingsPage
      historyType="messages"
      HistoryComponent={SignedMessageHistory}
      sessionId={sessionId}
    />
  )
}

export default SignedMessageHistorySettingsScreen

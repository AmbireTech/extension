import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'

import { SubmittedAccountOpLike } from '@ambire-common/libs/accountOp/submittedAccountOp'
import { useHumanizedCalls } from '@common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary/humanizedCallsHooks'
import CompactHumanizedCalls from '@common/modules/sign-account-op/components/CompactHumanizedCalls/CompactHumanizedCalls'

interface Props {
  submittedAccountOp: SubmittedAccountOpLike
  itemStyle?: StyleProp<ViewStyle>
}

/**
 * The calls of an already sent transaction, humanized the same way as while it was being signed.
 * Meant to be loaded lazily (see lazyPendingAccountOpCalls) as it pulls in the humanizer.
 */
const PendingAccountOpCalls = ({ submittedAccountOp, itemStyle }: Props) => {
  const humanizedCalls = useHumanizedCalls(submittedAccountOp)

  return (
    <CompactHumanizedCalls
      humanization={humanizedCalls}
      chainId={submittedAccountOp.chainId}
      itemStyle={itemStyle}
    />
  )
}

export default React.memo(PendingAccountOpCalls)

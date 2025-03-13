/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import {
  isIdentifiedByMultipleTxn,
  SubmittedAccountOp
} from '@ambire-common/libs/accountOp/submittedAccountOp'
import { humanizeAccountOp } from '@ambire-common/libs/humanizer'
import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import SkeletonLoader from '@common/components/SkeletonLoader'
import useTheme from '@common/hooks/useTheme'
import { SPACING_SM } from '@common/styles/spacings'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import TransactionSummary, {
  sizeMultiplier
} from '@web/modules/sign-account-op/components/TransactionSummary'

import Footer from './Footer'
import getStyles from './styles'

interface Props {
  submittedAccountOp: SubmittedAccountOp
  style?: ViewStyle
  size?: 'sm' | 'md' | 'lg'
  defaultType: 'summary' | 'full-info'
}

const SubmittedTransactionSummaryInner = ({
  submittedAccountOp,
  size = 'lg',
  style,
  defaultType
}: Props) => {
  const { styles } = useTheme(getStyles)
  const { networks } = useNetworksControllerState()

  const network: Network | undefined = useMemo(
    () => networks.find((n) => n.id === submittedAccountOp.networkId),
    [networks, submittedAccountOp.networkId]
  )

  const calls = useMemo(
    () =>
      humanizeAccountOp(submittedAccountOp, { network }).map((call, index) => ({
        ...call,
        // It's okay to use index as:
        // 1. The calls aren't reordered
        // 2. We are building the calls only once
        id: call.id || String(index)
      })),
    // Humanize the calls only once. Because submittedAccountOp is an object
    // it causes rerenders on every activity update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [submittedAccountOp.txnId, submittedAccountOp.calls.length, network]
  )

  if (!network) return null

  if (!calls.length) {
    return (
      <View style={style}>
        <SkeletonLoader width="100%" height={112} />
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        style,
        {
          paddingTop: SPACING_SM * sizeMultiplier[size]
        }
      ]}
    >
      {calls.map((call: IrCall) => (
        <TransactionSummary
          key={call.id}
          style={{ ...styles.summaryItem, marginBottom: SPACING_SM * sizeMultiplier[size] }}
          call={call}
          networkId={submittedAccountOp.networkId}
          isHistory
          enableExpand={defaultType === 'full-info'}
          size={size}
        />
      ))}
      <Footer
        size={size}
        defaultType={defaultType}
        network={network}
        rawCalls={submittedAccountOp.calls}
        txnId={submittedAccountOp.txnId}
        identifiedBy={submittedAccountOp.identifiedBy}
        accountAddr={submittedAccountOp.accountAddr}
        gasFeePayment={submittedAccountOp.gasFeePayment}
        status={submittedAccountOp.status}
        timestamp={submittedAccountOp.timestamp}
      />
    </View>
  )
}

const SubmittedTransactionSummary = ({
  submittedAccountOp,
  size = 'lg',
  style,
  defaultType
}: Props) => {
  // If the account op consists of multiple EOA transactions,
  // we need to divide them into separate components.
  // This will make them appear as if they were broadcasted one by one.
  const accountOpDividedIntoMultipleIfNeeded = isIdentifiedByMultipleTxn(
    submittedAccountOp.identifiedBy
  )
    ? submittedAccountOp.calls.map((call) => {
        return {
          ...submittedAccountOp,
          txnId: call.txnId,
          status: call.status,
          calls: [call]
        }
      })
    : [submittedAccountOp]

  return (
    <>
      {accountOpDividedIntoMultipleIfNeeded.map((op) => (
        <SubmittedTransactionSummaryInner
          key={op.txnId}
          submittedAccountOp={op}
          size={size}
          style={style}
          defaultType={defaultType}
        />
      ))}
    </>
  )
}

export default React.memo(SubmittedTransactionSummary)

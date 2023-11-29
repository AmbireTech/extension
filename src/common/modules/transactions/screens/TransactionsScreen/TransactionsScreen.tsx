import React from 'react'
import { View } from 'react-native'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Spinner from '@common/components/Spinner'
import Wrapper from '@common/components/Wrapper'
import useAccounts from '@common/hooks/useAccounts'
import useNetwork from '@common/hooks/useNetwork'
import useRequests from '@common/hooks/useRequests'
import { DetailedBundleProvider } from '@common/modules/send/contexts/detailedBundleContext'
import TransactionsSectionList from '@common/modules/transactions/components/TransactionsSectionList'
import useTransactions from '@common/modules/transactions/hooks/useTransactions'
import flexboxStyles from '@common/styles/utils/flexbox'

import styles from './styles'

const TransactionsScreen = () => {
  const {
    data,
    feeAssets,
    errMsg,
    isLoading,
    speedup,
    replace,
    cancel,
    firstPending,
    showSendTxns,
    forceRefresh
  } = useTransactions()
  const { eligibleRequests } = useRequests()
  const { network } = useNetwork()
  const { selectedAcc } = useAccounts()

  if (isLoading && !data) {
    return (
      <GradientBackgroundWrapper>
        <Wrapper>
          <View
            style={[flexboxStyles.flex1, flexboxStyles.alignCenter, flexboxStyles.justifyCenter]}
          >
            <Spinner />
          </View>
        </Wrapper>
      </GradientBackgroundWrapper>
    )
  }

  return (
    <DetailedBundleProvider feeAssets={feeAssets}>
      <GradientBackgroundWrapper>
        <View style={styles.sectionViewWrapper}>
          <TransactionsSectionList
            data={data}
            feeAssets={feeAssets}
            errMsg={errMsg}
            isLoading={isLoading}
            speedup={speedup}
            replace={replace}
            cancel={cancel}
            firstPending={firstPending}
            showSendTxns={showSendTxns}
            forceRefresh={forceRefresh}
            eligibleRequests={eligibleRequests}
            networkId={network?.id}
            selectedAcc={selectedAcc}
          />
        </View>
      </GradientBackgroundWrapper>
    </DetailedBundleProvider>
  )
}

export default TransactionsScreen

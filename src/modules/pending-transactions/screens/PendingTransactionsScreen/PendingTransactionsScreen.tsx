import React, { useEffect, useLayoutEffect } from 'react'

import CONFIG from '@config/env'
import { useTranslation } from '@config/localization'
import Text from '@modules/common/components/Text'
import Wrapper from '@modules/common/components/Wrapper'
import useAccounts from '@modules/common/hooks/useAccounts'
import usePrevious from '@modules/common/hooks/usePrevious'
import useRequests from '@modules/common/hooks/useRequests'
import FailingTxn from '@modules/pending-transactions/components/FailingTxn'
import FeeSelector from '@modules/pending-transactions/components/FeeSelector'
import SignActions from '@modules/pending-transactions/components/SignActions'
import SigningWithAccount from '@modules/pending-transactions/components/SigningWithAccount'
import TransactionSummary from '@modules/pending-transactions/components/TransactionSummary'
import useSendTransaction from '@modules/pending-transactions/hooks/useSendTransaction'
import { StackActions } from '@react-navigation/native'

const PendingTransactionsScreen = ({ navigation }: any) => {
  const { t } = useTranslation()
  const { setSendTxnState } = useRequests()
  const { account } = useAccounts()
  const {
    bundle,
    signingStatus,
    estimation,
    feeSpeed,
    setEstimation,
    setFeeSpeed,
    approveTxn,
    rejectTxn
  } = useSendTransaction()

  const prevBundle: any = usePrevious(bundle)

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: `Pending Transactions: ${bundle?.txns?.length}`
    })
  }, [navigation, bundle?.txns?.length])

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      setSendTxnState({ showing: false })
    })

    return unsubscribe
  }, [navigation])

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setSendTxnState({ showing: false })
      navigation.dispatch(StackActions.popToTop())
    })

    return unsubscribe
  }, [navigation])

  // useEffect(() => {
  //   const unsubscribe = navigation.addListener('tabPress', () => {
  //     setSendTxnState({ showing: false })
  //   })

  //   return unsubscribe
  // }, [navigation])

  useEffect(() => {
    if (prevBundle?.txns?.length && !bundle?.txns?.length) {
      navigation.goBack()
    }
  })

  if (!account || !bundle?.txns?.length)
    return (
      <Wrapper>
        <Text style={{ color: 'red' }}>
          {t('SendTransactions: No account or no requests: should never happen.')}
        </Text>
      </Wrapper>
    )

  return (
    <Wrapper>
      <SigningWithAccount />
      <TransactionSummary bundle={bundle} estimation={estimation} />
      <FeeSelector
        disabled={
          signingStatus && signingStatus.finalBundle && !(estimation && !estimation.success)
        }
        signer={bundle.signer}
        estimation={estimation}
        setEstimation={setEstimation}
        feeSpeed={feeSpeed}
        setFeeSpeed={setFeeSpeed}
      />
      {!!bundle?.signer?.quickAccManager && !CONFIG.RELAYER_URL ? (
        <FailingTxn message="Signing transactions with an email/password account without being connected to the relayer is unsupported." />
      ) : (
        <SignActions
          estimation={estimation}
          approveTxn={approveTxn}
          rejectTxn={rejectTxn}
          signingStatus={signingStatus}
          feeSpeed={feeSpeed}
        />
      )}
    </Wrapper>
  )
}

export default PendingTransactionsScreen

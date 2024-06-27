/* eslint-disable @typescript-eslint/no-floating-promises */
import { formatUnits } from 'ethers'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'

import { SubmittedAccountOp } from '@ambire-common/controllers/activity/activity'
import { AccountOpStatus } from '@ambire-common/libs/accountOp/accountOp'
import { callsHumanizer, HUMANIZER_META_KEY } from '@ambire-common/libs/humanizer'
import { HumanizerVisualization, IrCall } from '@ambire-common/libs/humanizer/interfaces'
import { humanizerMetaParsing } from '@ambire-common/libs/humanizer/parsers/humanizerMetaParsing'
import { randomId } from '@ambire-common/libs/humanizer/utils'
import OpenIcon from '@common/assets/svg/OpenIcon'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import formatDecimals from '@common/utils/formatDecimals'
import { storage } from '@web/extension-services/background/webapi/storage'
import { createTab } from '@web/extension-services/background/webapi/tab'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'
import TransactionSummary from '@web/modules/sign-account-op/components/TransactionSummary'

import getStyles from './styles'

interface Props {
  submittedAccountOp: SubmittedAccountOp
  style?: ViewStyle
}

const SubmittedTransactionSummary = ({ submittedAccountOp, style }: Props) => {
  const { styles } = useTheme(getStyles)
  const { addToast } = useToast()
  const { accounts } = useAccountsControllerState()
  const settingsState = useSettingsControllerState()
  const networksState = useNetworksControllerState()
  const keystoreState = useKeystoreControllerState()
  const { t } = useTranslation()

  const [humanizedCalls, setHumanizedCalls] = useState<IrCall[]>([])
  const [humanizerError, setHumanizerError] = useState(null)
  const [submittedAccountOpFee, setSubmittedAccountOpFee] = useState<HumanizerVisualization | null>(
    null
  )

  const network = useMemo(
    () => networksState.networks.filter((n) => n.id === submittedAccountOp.networkId)[0],
    [networksState.networks, submittedAccountOp.networkId]
  )

  useEffect(() => {
    callsHumanizer(
      submittedAccountOp,
      storage,
      window.fetch.bind(window),
      (calls) => {
        setHumanizedCalls(calls)
      },
      (err: any) => setHumanizerError(err),
      { noAsyncOperations: true, network }
    )
  }, [submittedAccountOp, keystoreState.keys, accounts, settingsState.keyPreferences, network])

  const calls = useMemo(() => {
    if (humanizerError) return submittedAccountOp.calls

    return humanizedCalls
  }, [humanizedCalls, humanizerError, submittedAccountOp.calls])

  const feeFormattedValue = useMemo(() => {
    if (!submittedAccountOpFee || !submittedAccountOp.gasFeePayment?.amount) return null

    const fee = parseFloat(
      formatUnits(
        submittedAccountOpFee!.amount || submittedAccountOp.gasFeePayment!.amount,
        submittedAccountOpFee?.humanizerMeta?.token?.decimals
      )
    )
    return `${formatDecimals(fee)} ${submittedAccountOpFee?.humanizerMeta?.token?.symbol}`
  }, [submittedAccountOp.gasFeePayment, submittedAccountOpFee])

  useEffect(() => {
    ;(async () => {
      const meta = await storage.get(HUMANIZER_META_KEY, {})
      const res = humanizerMetaParsing(
        {
          humanizerMeta: meta,
          accountAddr: submittedAccountOp.accountAddr,
          networkId: submittedAccountOp.networkId
        },
        [
          {
            type: 'token',
            amount: submittedAccountOp.gasFeePayment?.amount,
            address: submittedAccountOp.gasFeePayment?.inToken,
            id: randomId()
          }
        ],
        { network }
      )
      setSubmittedAccountOpFee(res?.[0]?.[0])
    })()
  }, [
    submittedAccountOp.accountAddr,
    submittedAccountOp.gasFeePayment?.amount,
    submittedAccountOp.gasFeePayment?.inToken,
    submittedAccountOp.networkId,
    network
  ])

  const handleOpenExplorer = useCallback(async () => {
    const networkId = network.id

    if (!networkId || !submittedAccountOp.txnId) throw new Error('Invalid networkId or txnId')

    let link = `https://benzin.ambire.com/?txnId=${
      submittedAccountOp.txnId
    }&networkId=${networkId}${
      submittedAccountOp.userOpHash ? `&userOpHash=${submittedAccountOp.userOpHash}` : ''
    }`

    // if the network is a not a predefined one, benzina will not work so we open the block explorer
    if (!network.predefined) {
      link = `${network.explorerUrl}/tx/${submittedAccountOp.txnId}`
    }

    // in the rare case of a bug where we've failed to find the txnId
    // for an userOpHash, the userOpHash and the txnId will be the same.
    // In that case, open benzina only with the userOpHash
    if (
      !submittedAccountOp.txnId ||
      (submittedAccountOp.userOpHash &&
        submittedAccountOp.userOpHash === submittedAccountOp.txnId &&
        !network.predefined)
    ) {
      link = `https://benzin.ambire.com/?networkId=${networkId}&userOpHash=${submittedAccountOp.userOpHash}`
    }

    try {
      await createTab(link)
    } catch (e: any) {
      addToast(e?.message || 'Error opening explorer', { type: 'error' })
    }
  }, [
    addToast,
    network.id,
    network.explorerUrl,
    network.predefined,
    submittedAccountOp.userOpHash,
    submittedAccountOp.txnId
  ])

  return calls.length ? (
    <View style={[styles.container, style]}>
      {calls.map((call: IrCall, index) => (
        <TransactionSummary
          key={call.fromUserRequestId}
          style={styles.summaryItem}
          call={call}
          networkId={submittedAccountOp.networkId}
          rightIcon={
            index === 0 &&
            (!submittedAccountOp.status ||
              submittedAccountOp.status !== AccountOpStatus.Rejected) ? (
              <OpenIcon />
            ) : null
          }
          onRightIconPress={handleOpenExplorer}
          isHistory
        />
      ))}
      {submittedAccountOp.status !== AccountOpStatus.Rejected && (
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Text fontSize={14} appearance="secondaryText" weight="semiBold">
              {t('Fee')}:{' '}
            </Text>
            <Text fontSize={14} appearance="secondaryText" style={spacings.mrTy}>
              {feeFormattedValue || <SkeletonLoader width={80} height={21} />}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Text fontSize={14} appearance="secondaryText" weight="semiBold">
              {t('Submitted on')}:{' '}
            </Text>
            {new Date(submittedAccountOp.timestamp).toString() !== 'Invalid Date' && (
              <Text fontSize={14} appearance="secondaryText" style={spacings.mrTy}>
                {`${new Date(submittedAccountOp.timestamp).toLocaleDateString()} (${new Date(
                  submittedAccountOp.timestamp
                ).toLocaleTimeString()})`}
              </Text>
            )}
          </View>
          <View style={styles.footerItem}>
            <Text fontSize={14} appearance="secondaryText" weight="semiBold">
              {t('Block Explorer')}:{' '}
            </Text>
            <Text fontSize={14} appearance="secondaryText" style={spacings.mrTy}>
              {new URL(network.explorerUrl).hostname}
            </Text>
          </View>
        </View>
      )}
      {submittedAccountOp.status === AccountOpStatus.Rejected && (
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Text fontSize={14} appearance="errorText" style={spacings.mrTy}>
              Failed to send
            </Text>
          </View>
        </View>
      )}
    </View>
  ) : (
    <View style={style}>
      <SkeletonLoader width="100%" height={112} />
    </View>
  )
}

export default React.memo(SubmittedTransactionSummary)

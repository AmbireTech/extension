/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { FC, useCallback } from 'react'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import { SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import { BROADCAST_OPTIONS } from '@ambire-common/libs/broadcast/broadcast'
import { getBenzinUrlParams } from '@ambire-common/utils/benzin'
import CopyIcon from '@common/assets/svg/CopyIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import RefreshIcon from '@common/assets/svg/RefreshIcon'
import SpeedUpIcon from '@common/assets/svg/SpeedUpIcon'
import Button from '@common/components/Button'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import { openInTab } from '@common/utils/links'

import getStyles from './styles'

type Props = {
  network: Network
  size: 'sm' | 'md' | 'lg'
  rawCalls?: SubmittedAccountOp['calls']
  submittedAccountOp: SubmittedAccountOp
} & Pick<SubmittedAccountOp, 'txnId' | 'identifiedBy' | 'accountAddr' | 'gasFeePayment' | 'status'>

const increaseByFifteenPercent = (value: bigint) => (value * 115n + 99n) / 100n
const EXPLORER_LINKS_DISABLED_TOOLTIP =
  'Explorer links are on the right side of each transaction in transaction details'

const Footer: FC<Props> = ({
  network,
  txnId,
  rawCalls,
  submittedAccountOp,
  identifiedBy,
  accountAddr,
  gasFeePayment,
  status
}) => {
  const { styles } = useTheme(getStyles)
  const { addToast } = useToast()
  const {
    state: { account: selectedAccount }
  } = useController('SelectedAccountController')
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const { t } = useTranslation()

  const { chainId } = network
  const isPendingTransaction =
    status === AccountOpStatus.Pending || status === AccountOpStatus.BroadcastedButNotConfirmed
  // the whole account op is a failure / success
  // or at least one call is a failure / success
  // means that there's at least one explorer transaction for checking
  const isMinedTransaction =
    status === AccountOpStatus.Failure ||
    status === AccountOpStatus.Success ||
    (submittedAccountOp.identifiedBy.type === 'MultipleTxns' &&
      submittedAccountOp.calls.find(
        (c) => c.status === AccountOpStatus.Failure || c.status === AccountOpStatus.Success
      ))
  const areExplorerButtonsDisabled =
    submittedAccountOp.identifiedBy.type === 'MultipleTxns' && submittedAccountOp.calls.length > 1
  const shouldShowSpeedUp =
    isPendingTransaction &&
    gasFeePayment?.broadcastOption !== BROADCAST_OPTIONS.byRelayer &&
    gasFeePayment?.broadcastOption !== BROADCAST_OPTIONS.byBundler
  const canRepeatTransaction = !!rawCalls?.length && selectedAccount?.addr === accountAddr

  const benzinLink = `https://explorer.ambire.com/${getBenzinUrlParams({
    txnId,
    chainId: Number(chainId),
    identifiedBy
  })}`

  const handleCopyTransaction = useCallback(() => {
    if (!chainId) {
      const message = t(
        "Can't copy the transaction link because the network information is missing."
      )
      addToast(message, { type: 'error' })

      return
    }

    setStringAsync(benzinLink)
    addToast(t('Copied to clipboard!') as string, { timeout: 2500 })
  }, [addToast, benzinLink, chainId, t])

  const handleRepeatTransaction = useCallback(() => {
    if (!rawCalls) return

    requestsDispatch({
      type: 'method',
      params: {
        method: 'build',
        args: [
          {
            type: 'calls',
            params: {
              userRequestParams: {
                calls: rawCalls,
                meta: { chainId: network.chainId, accountAddr }
              }
            }
          }
        ]
      }
    })
  }, [rawCalls, requestsDispatch, network.chainId, accountAddr])

  const handleSpeedUpTransaction = useCallback(() => {
    if (!submittedAccountOp.calls || !submittedAccountOp.gasFeePayment) return

    const nextGasFeePayment = {
      ...submittedAccountOp.gasFeePayment,
      gasPrice: increaseByFifteenPercent(submittedAccountOp.gasFeePayment.gasPrice),
      maxPriorityFeePerGas:
        submittedAccountOp.gasFeePayment.maxPriorityFeePerGas &&
        submittedAccountOp.gasFeePayment.maxPriorityFeePerGas !== 0n
          ? increaseByFifteenPercent(submittedAccountOp.gasFeePayment.maxPriorityFeePerGas)
          : submittedAccountOp.gasFeePayment.maxPriorityFeePerGas
    }

    requestsDispatch({
      type: 'method',
      params: {
        method: 'build',
        args: [
          {
            type: 'calls',
            params: {
              userRequestParams: {
                calls: submittedAccountOp.calls,
                meta: {
                  chainId: submittedAccountOp.chainId,
                  accountAddr: submittedAccountOp.accountAddr
                },
                accountOp: {
                  id: submittedAccountOp.id,
                  accountAddr: submittedAccountOp.accountAddr,
                  chainId: submittedAccountOp.chainId,
                  signingKeyAddr: submittedAccountOp.signingKeyAddr,
                  signingKeyType: submittedAccountOp.signingKeyType,
                  nonce: submittedAccountOp.nonce,
                  eoaNonce: submittedAccountOp.eoaNonce,
                  calls: submittedAccountOp.calls,
                  feeCall: submittedAccountOp.feeCall,
                  activatorCall: submittedAccountOp.activatorCall,
                  gasLimit: submittedAccountOp.gasLimit,
                  signature: submittedAccountOp.signature,
                  gasFeePayment: nextGasFeePayment,
                  txnId: submittedAccountOp.txnId,
                  asUserOperation: submittedAccountOp.asUserOperation,
                  signers: submittedAccountOp.signers,
                  signed: submittedAccountOp.signed,
                  safeTx: submittedAccountOp.safeTx,
                  flags: submittedAccountOp.flags,
                  meta: {
                    ...submittedAccountOp.meta,
                    speedUp: {
                      enabled: true
                    }
                  }
                }
              }
            }
          }
        ]
      }
    })
  }, [submittedAccountOp, requestsDispatch])

  const handleOpenExplorer = useCallback(async () => {
    if (!chainId || !network.explorerUrl || !txnId) {
      const message = t(
        "Can't open the transaction details because the transaction or network information is missing."
      )
      addToast(message, { type: 'error' })

      return
    }

    const explorerUrl = network.explorerUrl.replace(/\/$/, '')
    const link = `${explorerUrl}/tx/${txnId}`

    try {
      await openInTab({ url: link })
    } catch (e: any) {
      addToast(e?.message || 'Error opening explorer', { type: 'error' })
    }
  }, [txnId, addToast, chainId, network.explorerUrl, t])

  if (!canRepeatTransaction && !isMinedTransaction) return null

  return (
    <View style={styles.footer}>
      <View style={styles.footerButtonsRow}>
        <View
          dataSet={createGlobalTooltipDataSet({
            id: `open-explorer-disabled-${submittedAccountOp.id}`,
            content: t(EXPLORER_LINKS_DISABLED_TOOLTIP),
            hidden: !areExplorerButtonsDisabled
          })}
        >
          <Button
            text={t('Open explorer')}
            type="outline"
            onPress={handleOpenExplorer}
            size="smaller"
            disabled={areExplorerButtonsDisabled}
            hasBottomSpacing={false}
            style={[styles.footerButton]}
            childrenPosition="left"
            testID="view-transaction-link"
          >
            <OpenIcon style={spacings.mrMi} width={16} height={16} />
          </Button>
        </View>

        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <View
            dataSet={createGlobalTooltipDataSet({
              id: `repeat-disabled-${submittedAccountOp.id}`,
              content: t('Switch to this account to proceed'),
              hidden: canRepeatTransaction
            })}
          >
            <Button
              type="tertiary"
              text={t(shouldShowSpeedUp ? 'Speed up' : 'Repeat')}
              onPress={shouldShowSpeedUp ? handleSpeedUpTransaction : handleRepeatTransaction}
              size="smaller"
              hasBottomSpacing={false}
              disabled={!canRepeatTransaction}
              style={[styles.footerButton, spacings.mrTy]}
              childrenPosition="left"
            >
              {shouldShowSpeedUp ? (
                <SpeedUpIcon style={spacings.mrMi} width={16} height={16} />
              ) : (
                <RefreshIcon style={spacings.mrMi} width={16} height={16} />
              )}
            </Button>
          </View>

          <View
            dataSet={createGlobalTooltipDataSet({
              id: `copy-explorer-link-disabled-${submittedAccountOp.id}`,
              content: t(EXPLORER_LINKS_DISABLED_TOOLTIP),
              hidden: !areExplorerButtonsDisabled
            })}
          >
            <Button
              text={t('Copy link')}
              onPress={handleCopyTransaction}
              type="primary"
              size="smaller"
              disabled={areExplorerButtonsDisabled}
              hasBottomSpacing={false}
              style={styles.footerButton}
              childrenPosition="left"
            >
              <CopyIcon style={spacings.mrMi} width={16} height={16} />
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}

export default Footer

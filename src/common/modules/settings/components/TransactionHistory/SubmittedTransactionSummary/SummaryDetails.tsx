import React, { useMemo } from 'react'
import { Pressable, View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import CopyIcon from '@common/assets/svg/CopyIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import NetworkIcon from '@common/components/NetworkIcon'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import PendingTokenSummary from '@common/modules/sign-account-op/components/PendingTokenSummary'
import TransactionSummary, {
  sizeMultiplier
} from '@common/modules/sign-account-op/components/TransactionSummary'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import { openInTab } from '@common/utils/links'
import DelegationHumanization from '@web/components/DelegationHumanization'

import {
  getFormattedSubmittedDate,
  getHumanizedCalls,
  getModalFinalStatus,
  getPresentationalStatus,
  getSummaryBalanceChanges,
  getTruncatedNetworkName,
  getTruncatedTxnHash
} from './helpers'
import getStyles from './styles'
import { DisplayBalanceChange, Props, SubmittedAccountOpLike } from './types'

const SummaryDetails = ({
  submittedAccountOp,
  network,
  size,
  defaultType
}: {
  submittedAccountOp: SubmittedAccountOpLike
  network: Network
  size: 'sm' | 'md' | 'lg'
  defaultType: Props['defaultType']
}) => {
  const { styles, theme } = useTheme(getStyles)
  const { t } = useTranslation()
  const { addToast } = useToast()
  const submittedDate = useMemo(
    () => getFormattedSubmittedDate(submittedAccountOp.timestamp),
    [submittedAccountOp.timestamp]
  )
  const humanizedCalls = useMemo(() => getHumanizedCalls(submittedAccountOp), [submittedAccountOp])
  const summaryBalanceChanges = useMemo(
    () => getSummaryBalanceChanges(submittedAccountOp),
    [submittedAccountOp]
  )
  const isNotFound =
    submittedAccountOp.status === AccountOpStatus.BroadcastButStuck ||
    submittedAccountOp.status === AccountOpStatus.UnknownButPastNonce ||
    submittedAccountOp.status === AccountOpStatus.Rejected
  const hasBalanceChangesLoaded =
    typeof submittedAccountOp.balanceChanges !== 'undefined' || isNotFound
  const assetsOut = useMemo(
    () => summaryBalanceChanges.filter((change) => change.balanceChange < 0n),
    [summaryBalanceChanges]
  )
  const assetsIn = useMemo(
    () => summaryBalanceChanges.filter((change) => change.balanceChange > 0n),
    [summaryBalanceChanges]
  )
  const hasAssetBalanceChanges = !!(assetsOut.length || assetsIn.length)
  const isDelegationTxn =
    submittedAccountOp.meta && submittedAccountOp.meta.setDelegation !== undefined
  const isPendingConfirmation =
    submittedAccountOp.status === AccountOpStatus.Pending ||
    submittedAccountOp.status === AccountOpStatus.BroadcastedButNotConfirmed
  const modalFinalStatus = getModalFinalStatus(getPresentationalStatus(submittedAccountOp))
  const shouldShowTransactionHashStep =
    submittedAccountOp.identifiedBy.type !== 'MultipleTxns' &&
    (submittedAccountOp.status === AccountOpStatus.Success ||
      submittedAccountOp.status === AccountOpStatus.Failure) &&
    !!submittedAccountOp.txnId
  const openCallExplorer = async (callTxnId?: string) => {
    if (!callTxnId || !network.explorerUrl) return

    const explorerUrl = network.explorerUrl.replace(/\/$/, '')
    await openInTab({ url: `${explorerUrl}/tx/${callTxnId}` })
  }

  const renderBalanceChangesCard = (title: string, changes: DisplayBalanceChange[]) => (
    <View
      style={[
        styles.modalSimulationContainer,
        title === 'Assets out' && assetsIn.length ? spacings.mrTy : undefined
      ]}
    >
      <View style={styles.modalSimulationContainerHeader}>
        <Text fontSize={14} weight="semiBold" appearance="secondaryText">
          {t(title)}
        </Text>
      </View>
      <View style={styles.modalSimulationBody}>
        {changes.map((change, index) => (
          <PendingTokenSummary
            key={`${change.address}-${change.balanceChange.toString()}`}
            token={{
              ...change,
              simulationAmount: change.balanceChange
            }}
            chainId={change.chainId}
            hasBottomSpacing={index < changes.length - 1}
          />
        ))}
      </View>
    </View>
  )

  const loadingBalanceChanges = (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.phSm,
        spacings.pvSm,
        {
          backgroundColor: theme.secondaryBackground,
          borderWidth: 1,
          borderColor: theme.secondaryBorder,
          ...common.borderRadiusPrimary
        }
      ]}
    >
      <Spinner style={{ width: 18, height: 18 }} />
      <Text style={spacings.mlSm} fontSize={14} appearance="secondaryText">
        {t('Loading balance changes')}
      </Text>
    </View>
  )

  return (
    <View style={spacings.phSm}>
      <View style={spacings.phSm}>
        <View style={styles.modalSection} testID="activity-transaction-details-step">
          <Text appearance="tertiaryText" weight="medium" style={spacings.mbSm}>
            {t('Transaction details')}
          </Text>
          {!isDelegationTxn &&
            humanizedCalls.map((call: IrCall, i) => (
              <TransactionSummary
                key={`${submittedAccountOp.id}-${i}-${call.txnId}-${call.id}`}
                style={{ marginBottom: SPACING_SM * sizeMultiplier[size] }}
                call={call}
                chainId={submittedAccountOp.chainId}
                type="benzin"
                enableExpand={defaultType === 'full-info'}
                size={size}
                hideLinks
                rightIcon={
                  submittedAccountOp.calls[i]?.txnId && network.explorerUrl ? (
                    <View
                      dataSet={createGlobalTooltipDataSet({
                        id: `call-open-explorer-${submittedAccountOp.id}-${i}`,
                        content: 'Open explorer'
                      })}
                    >
                      <OpenIcon width={18} height={18} color={theme.secondaryText} />
                    </View>
                  ) : undefined
                }
                hasCallFailed={
                  !isPendingConfirmation &&
                  submittedAccountOp.identifiedBy.type === 'MultipleTxns' &&
                  submittedAccountOp.calls[i]?.txnId === undefined
                }
                onRightIconPress={
                  submittedAccountOp.calls[i]?.txnId && network.explorerUrl
                    ? () => {
                        void openCallExplorer(submittedAccountOp.calls[i]?.txnId)
                      }
                    : undefined
                }
              />
            ))}
          {!isDelegationTxn && !humanizedCalls.length && (
            <SkeletonLoader width="100%" height={112} />
          )}
          {isDelegationTxn && (
            <View style={spacings.pbSm}>
              <DelegationHumanization
                setDelegation={submittedAccountOp.meta?.setDelegation}
                delegatedContract={submittedAccountOp.meta?.delegation?.address}
              />
            </View>
          )}
        </View>
        <View style={[styles.modalSection, spacings.pb0]} testID="activity-balance-changes-step">
          <Text appearance="tertiaryText" weight="medium" style={spacings.mbSm}>
            {t('Balance changes')}
          </Text>
          <View style={flexbox.flex1}>
            {hasAssetBalanceChanges && (
              <View style={[flexbox.directionRow, flexbox.flex1]}>
                {!!assetsOut.length && (
                  <View style={[flexbox.flex1, assetsIn.length ? spacings.mrTy : undefined]}>
                    {renderBalanceChangesCard('Assets out', assetsOut)}
                  </View>
                )}
                {!!assetsIn.length && (
                  <View style={flexbox.flex1}>
                    {renderBalanceChangesCard('Assets in', assetsIn)}
                  </View>
                )}
              </View>
            )}
            {!hasBalanceChangesLoaded && (
              <View style={hasAssetBalanceChanges ? spacings.mtSm : undefined}>
                {loadingBalanceChanges}
              </View>
            )}
            {hasBalanceChangesLoaded &&
              !hasAssetBalanceChanges &&
              (isPendingConfirmation ? (
                loadingBalanceChanges
              ) : (
                <View
                  style={[
                    spacings.phSm,
                    spacings.pvSm,
                    {
                      backgroundColor: theme.secondaryBackground,
                      borderWidth: 1,
                      borderColor: theme.secondaryBorder,
                      ...common.borderRadiusPrimary
                    }
                  ]}
                >
                  <Text fontSize={14} appearance="secondaryText">
                    {t('No balance changes detected')}
                  </Text>
                </View>
              ))}
          </View>
        </View>
        {shouldShowTransactionHashStep && (
          <View
            style={[styles.modalConfirmedRow, spacings.mbSm]}
            testID="activity-transaction-hash-step"
          >
            <View style={styles.modalStepRow}>
              <Text appearance="tertiaryText" weight="medium">
                {t('Transaction hash')}
              </Text>
              <View style={styles.modalStepRowRight}>
                <Text fontSize={14} appearance="secondaryText">
                  {getTruncatedTxnHash(submittedAccountOp.txnId)}
                </Text>
                <Pressable
                  onPress={() => {
                    if (!submittedAccountOp.txnId) return
                    void setStringAsync(submittedAccountOp.txnId)
                    addToast(t('Copied to clipboard!') as string, { timeout: 2500 })
                  }}
                  style={styles.modalHashCopyButton}
                >
                  <CopyIcon width={16} height={16} color={theme.primaryText} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
        {!!modalFinalStatus && (
          <View style={[styles.modalConfirmedRow, spacings.mbSm]} testID="activity-confirmed-step">
            <View style={[styles.modalStepRow, spacings.mbSm]}>
              <Text appearance={modalFinalStatus.appearance} fontSize={16} weight="medium">
                {modalFinalStatus.label}
              </Text>
              {submittedAccountOp.status === AccountOpStatus.Success && (
                <View style={styles.modalStepRowRight}>
                  <Text fontSize={14} appearance="secondaryText">
                    {submittedDate} on {getTruncatedNetworkName(network.name)}
                  </Text>
                  <NetworkIcon
                    id={submittedAccountOp.chainId.toString()}
                    size={20}
                    style={spacings.mlMi}
                  />
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

export default React.memo(SummaryDetails)

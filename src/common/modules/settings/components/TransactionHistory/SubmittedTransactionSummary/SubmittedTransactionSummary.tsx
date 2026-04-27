import { formatUnits, ZeroAddress } from 'ethers'
import React, { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { Network } from '@ambire-common/interfaces/network'
import { BalanceChange, SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import { humanizeAccountOp } from '@ambire-common/libs/humanizer'
import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import CopyIcon from '@common/assets/svg/CopyIcon'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import SwapIcon from '@common/assets/svg/SwapIcon'
import BottomSheet from '@common/components/BottomSheet'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import NetworkIcon from '@common/components/NetworkIcon'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useMultiHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import PendingTokenSummary from '@common/modules/sign-account-op/components/PendingTokenSummary'
import TransactionSummary, {
  sizeMultiplier
} from '@common/modules/sign-account-op/components/TransactionSummary'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { checkIfImageExists } from '@common/utils/checkIfImageExists'
import { setStringAsync } from '@common/utils/clipboard'
import { openInTab } from '@common/utils/links'
import DelegationHumanization from '@web/components/DelegationHumanization'
import ManifestImage from '@web/components/ManifestImage'

import Footer from './Footer'
import StatusBadge from './StatusBadge'
import getStyles from './styles'

interface Props {
  submittedAccountOp: SubmittedAccountOp
  style?: ViewStyle
  size?: 'sm' | 'md' | 'lg'
  defaultType: 'summary' | 'full-info'
  modalType?: 'modal' | 'bottom-sheet'
}

type DappInteraction = {
  id: string
  name: string
  iconUrl?: string | null
  iconType?: 'send' | 'swap'
}

type DisplayBalanceChange = BalanceChange & {
  iconType?: 'gasTank'
}

const MAX_VISIBLE_BALANCE_CHANGES = 3
const dappIconAvailabilityCache = new Map<string, boolean>()

const formatBalanceChangeAmount = (change: DisplayBalanceChange) => {
  const formattedAmount = formatDecimals(
    parseFloat(
      formatUnits(
        change.balanceChange < 0n ? -change.balanceChange : change.balanceChange,
        change.decimals
      )
    ),
    'amount'
  )

  return `${change.balanceChange < 0n ? '-' : '+'}${formattedAmount}`
}

const getFullBalanceChangeAmount = (change: DisplayBalanceChange) =>
  formatUnits(
    change.balanceChange < 0n ? -change.balanceChange : change.balanceChange,
    change.decimals
  )

const getBalanceChangeTooltipId = (
  change: DisplayBalanceChange,
  submittedAccountOp: SubmittedAccountOp
) =>
  `balance-change-${submittedAccountOp.id}-${change.chainId}-${change.address}-${change.balanceChange.toString()}`

const BalanceChangeToken = ({ change }: { change: DisplayBalanceChange }) => {
  const { theme } = useTheme()

  if (change.iconType === 'gasTank') {
    return (
      <View style={spacings.mlTy}>
        <View style={[stylesForIcons.balanceIconWrapper, { backgroundColor: theme.neutral200 }]}>
          <GasTankIcon width={10} height={10} color={theme.tertiaryText} />
        </View>
      </View>
    )
  }

  return (
    <View style={spacings.mlTy}>
      <TokenIcon
        width={13}
        height={13}
        withContainer
        containerHeight={16}
        containerWidth={16}
        withNetworkIcon={false}
        address={change.address}
        chainId={change.chainId}
      />
    </View>
  )
}

const DappInteractionIcon = ({ interaction }: { interaction: DappInteraction }) => {
  const { theme } = useTheme()
  const [hasIcon, setHasIcon] = useState<boolean | null>(
    interaction.iconUrl ? (dappIconAvailabilityCache.get(interaction.iconUrl) ?? null) : false
  )

  useEffect(() => {
    if (!interaction.iconUrl) {
      setHasIcon(false)
      return
    }

    const cachedAvailability = dappIconAvailabilityCache.get(interaction.iconUrl)
    if (cachedAvailability !== undefined) {
      setHasIcon(cachedAvailability)
      return
    }

    let isMounted = true

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      const iconExists = !!interaction.iconUrl && (await checkIfImageExists(interaction.iconUrl))
      dappIconAvailabilityCache.set(interaction.iconUrl!, iconExists)

      if (isMounted) setHasIcon(iconExists)
    })()

    return () => {
      isMounted = false
    }
  }, [interaction.iconUrl])

  if (interaction.iconType === 'send') {
    return (
      <View style={[stylesForIcons.dappIconWrapper, { backgroundColor: theme.neutral200 }]}>
        <SendIcon width={20} height={20} color={theme.tertiaryText} />
      </View>
    )
  }

  if (interaction.iconType === 'swap') {
    return (
      <View style={[stylesForIcons.dappIconWrapper, { backgroundColor: theme.neutral200 }]}>
        <SwapIcon width={20} height={20} color={theme.tertiaryText} />
      </View>
    )
  }

  if (!interaction.iconUrl || !hasIcon) return null

  return (
    <View style={[stylesForIcons.dappIconWrapper, { backgroundColor: theme.neutral200 }]}>
      <ManifestImage
        uri={interaction.iconUrl}
        size={20}
        isRound
        imageStyle={stylesForIcons.manifestImage}
      />
    </View>
  )
}

const stylesForIcons = {
  manifestImage: {
    backgroundColor: 'transparent'
  },
  dappIconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...common.borderRadiusPrimary,
    ...spacings.mrTy
  },
  balanceIconWrapper: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...common.borderRadiusPrimary
  }
} as const

const getFormattedSubmittedDate = (timestamp: number) =>
  new Date(timestamp).toLocaleString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h12'
  })

const getTruncatedTxnHash = (txnId?: string) => {
  if (!txnId) return ''
  if (txnId.length <= 12) return txnId

  return `${txnId.slice(0, 6)}...${txnId.slice(-4)}`
}

const getModalFinalStatus = (status?: AccountOpStatus) => {
  switch (status) {
    case AccountOpStatus.UnknownButPastNonce:
      return { label: 'Replaced by fee (RBF)', appearance: 'errorText' as const }
    case AccountOpStatus.BroadcastButStuck:
      return { label: 'The transaction could not be found', appearance: 'errorText' as const }
    case AccountOpStatus.Rejected:
      return { label: 'Failed to send', appearance: 'errorText' as const }
    case AccountOpStatus.PartiallyComplete:
      return { label: 'Partially completed', appearance: 'warningText' as const }
    case AccountOpStatus.Failure:
      return { label: 'Failed', appearance: 'errorText' as const }
    case AccountOpStatus.Success:
      return { label: 'Confirmed', appearance: 'successText' as const }
    case AccountOpStatus.BroadcastedButNotConfirmed:
      return { label: 'The transaction is pending', appearance: 'warningText' as const }
    default:
      return null
  }
}

const getOrderedBalanceChanges = (submittedAccountOp: SubmittedAccountOp) => {
  const balanceChanges = submittedAccountOp.balanceChanges || []
  const positiveChanges = balanceChanges.filter((change) => change.balanceChange > 0n)
  const negativeChanges = balanceChanges.filter((change) => change.balanceChange < 0n)
  const nativeNegativeChanges = negativeChanges.filter(
    (change) => change.address.toLowerCase() === ZeroAddress.toLowerCase()
  )
  const nonNativeNegativeChanges = negativeChanges.filter(
    (change) => change.address.toLowerCase() !== ZeroAddress.toLowerCase()
  )

  return [...positiveChanges, ...nonNativeNegativeChanges, ...nativeNegativeChanges]
}

const getSyntheticGasTankBalanceChange = (
  submittedAccountOp: SubmittedAccountOp
): DisplayBalanceChange | null => {
  const gasFeePayment = submittedAccountOp.gasFeePayment

  if (!gasFeePayment?.isGasTank || gasFeePayment.amount <= 0n) return null

  return {
    symbol: 'Gas Tank',
    name: 'Gas Tank',
    decimals: 6,
    address: 'gas-tank',
    chainId: gasFeePayment.feeTokenChainId || submittedAccountOp.chainId,
    priceIn: [],
    marketDataIn: [],
    flags: {
      onGasTank: true,
      rewardsType: null,
      canTopUpGasTank: false,
      isFeeToken: true
    },
    amount: 0n,
    amountBefore: 0n,
    amountAfter: 0n,
    balanceChange: -gasFeePayment.amount,
    iconType: 'gasTank'
  }
}

const getSummaryBalanceChanges = (
  submittedAccountOp: SubmittedAccountOp
): DisplayBalanceChange[] => {
  const balanceChanges = getOrderedBalanceChanges(submittedAccountOp)
  const syntheticGasTankBalanceChange = getSyntheticGasTankBalanceChange(submittedAccountOp)

  return syntheticGasTankBalanceChange
    ? [...balanceChanges, syntheticGasTankBalanceChange]
    : balanceChanges
}

const getVisibleSummaryBalanceChanges = (balanceChanges: DisplayBalanceChange[]) => {
  const gasTankBalanceChange = balanceChanges.find((change) => change.iconType === 'gasTank')

  if (!gasTankBalanceChange || balanceChanges.length <= MAX_VISIBLE_BALANCE_CHANGES) {
    return balanceChanges.slice(0, MAX_VISIBLE_BALANCE_CHANGES)
  }

  return [
    ...balanceChanges
      .filter((change) => change.iconType !== 'gasTank')
      .slice(0, MAX_VISIBLE_BALANCE_CHANGES - 1),
    gasTankBalanceChange
  ]
}

const getHumanizedCalls = (submittedAccountOp: SubmittedAccountOp): IrCall[] =>
  humanizeAccountOp(submittedAccountOp).map((call, index) => ({
    ...call,
    id: call.id || String(index)
  }))

const getPresentationalStatus = (
  submittedAccountOp: SubmittedAccountOp
): SubmittedAccountOp['status'] => {
  if (
    submittedAccountOp.identifiedBy.type !== 'MultipleTxns' ||
    submittedAccountOp.status === AccountOpStatus.BroadcastedButNotConfirmed
  )
    return submittedAccountOp.status

  const callWithoutATxId = submittedAccountOp.calls.find((call) => call.txnId === undefined)
  return !callWithoutATxId ? submittedAccountOp.status : AccountOpStatus.PartiallyComplete
}

const getDappInteractions = (submittedAccountOp: SubmittedAccountOp): DappInteraction[] => {
  const interactions: DappInteraction[] = []
  const seen = new Set<string>()

  const addInteraction = (interaction: DappInteraction) => {
    if (seen.has(interaction.id)) return
    seen.add(interaction.id)
    interactions.push(interaction)
  }

  submittedAccountOp.calls.forEach((call) => {
    const dapp = call.dapp as Dapp | undefined
    if (!dapp?.name) return

    addInteraction({
      id: `dapp:${dapp.id || `${dapp.name}-${dapp.url || ''}`}`,
      name: dapp.name,
      iconUrl: dapp.icon
    })
  })

  const isSwap = !!submittedAccountOp.meta?.swapTxn
  if (isSwap) {
    addInteraction({
      id: 'fallback:swap',
      name: 'Swap/Bridge',
      iconType: 'swap'
    })
  }

  if (!interactions.length) {
    addInteraction({
      id: 'fallback:send',
      name: 'Send',
      iconType: 'send'
    })
  }

  return interactions
}

const SubmittedTransactionHeader = ({
  submittedAccountOp,
  network,
  size
}: {
  submittedAccountOp: SubmittedAccountOp
  network: Network
  size: 'sm' | 'md' | 'lg'
}) => {
  const { styles } = useTheme(getStyles)
  const submittedDate = useMemo(
    () => getFormattedSubmittedDate(submittedAccountOp.timestamp),
    [submittedAccountOp.timestamp]
  )

  return (
    <View style={[styles.header, spacings.phSm]}>
      <StatusBadge
        status={getPresentationalStatus(submittedAccountOp)}
        textSize={14 * sizeMultiplier[size]}
      />
      <View style={styles.headerMeta}>
        <Text fontSize={14 * sizeMultiplier[size]} appearance="secondaryText">
          {submittedDate} on {network.name}
        </Text>
        <NetworkIcon
          id={submittedAccountOp.chainId.toString()}
          size={20 * sizeMultiplier[size]}
          style={spacings.mlMi}
        />
      </View>
    </View>
  )
}

const SubmittedTransactionSummaryDetails = ({
  submittedAccountOp,
  network,
  size,
  defaultType
}: {
  submittedAccountOp: SubmittedAccountOp
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
  const orderedBalanceChanges = useMemo(
    () => getOrderedBalanceChanges(submittedAccountOp),
    [submittedAccountOp]
  )
  const isNotFound =
    submittedAccountOp.status === AccountOpStatus.BroadcastButStuck ||
    submittedAccountOp.status === AccountOpStatus.UnknownButPastNonce ||
    submittedAccountOp.status === AccountOpStatus.Rejected
  const hasBalanceChangesLoaded =
    typeof submittedAccountOp.balanceChanges !== 'undefined' || isNotFound
  const assetsOut = useMemo(
    () => orderedBalanceChanges.filter((change) => change.balanceChange < 0n),
    [orderedBalanceChanges]
  )
  const assetsIn = useMemo(
    () => orderedBalanceChanges.filter((change) => change.balanceChange > 0n),
    [orderedBalanceChanges]
  )
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

  const renderBalanceChangesCard = (title: string, changes: BalanceChange[]) => (
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
            chainId={submittedAccountOp.chainId}
            hasBottomSpacing={index < changes.length - 1}
          />
        ))}
      </View>
    </View>
  )

  return (
    <View style={[spacings.phSm]}>
      <View style={spacings.phSm}>
        <View style={styles.modalSection} testID="activity-transaction-details-step">
          <Text appearance="tertiaryText" fontSize={16} weight="medium" style={spacings.mbSm}>
            Transaction details
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
          <Text appearance="tertiaryText" fontSize={16} weight="medium" style={spacings.mbSm}>
            Balance changes
          </Text>
          <View style={flexbox.flex1}>
            {!hasBalanceChangesLoaded && (
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
                  Loading balance changes
                </Text>
              </View>
            )}
            {hasBalanceChangesLoaded && !!(assetsOut.length || assetsIn.length) && (
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
            {hasBalanceChangesLoaded &&
              !assetsOut.length &&
              !assetsIn.length &&
              (isPendingConfirmation ? (
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
                    Loading balance changes
                  </Text>
                </View>
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
                    No balance changes detected
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
              <Text appearance="tertiaryText" fontSize={16} weight="medium">
                Transaction hash
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
                    {submittedDate} on {network.name}
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

const SubmittedTransactionSummaryInner = ({
  submittedAccountOp,
  size = 'lg',
  style,
  defaultType,
  modalType
}: Props) => {
  const { styles, theme } = useTheme(getStyles)
  const { dispatch: activityDispatch } = useController('ActivityController')
  const { networks } = useController('NetworksController').state
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  const network: Network | undefined = useMemo(
    () => networks.find((n) => n.chainId === submittedAccountOp.chainId),
    [networks, submittedAccountOp.chainId]
  )
  const orderedBalanceChanges = useMemo(
    () => getSummaryBalanceChanges(submittedAccountOp),
    [submittedAccountOp]
  )
  const visibleBalanceChanges = useMemo(
    () => getVisibleSummaryBalanceChanges(orderedBalanceChanges),
    [orderedBalanceChanges]
  )
  const hiddenBalanceChangesCount = Math.max(
    orderedBalanceChanges.length - MAX_VISIBLE_BALANCE_CHANGES,
    0
  )
  const shouldShowBalanceChangesSummary = orderedBalanceChanges.length > 0
  const dappInteractions = useMemo(
    () => getDappInteractions(submittedAccountOp),
    [submittedAccountOp]
  )

  const handleOpenDetails = () => {
    // note: it's really important to check for 'undefined' here
    // as balanceChanges could just be an empty array - we don't
    // want to rescan each time if that is the case. We want to
    // scan only old txn that do not have this data
    if (typeof submittedAccountOp.balanceChanges === 'undefined') {
      activityDispatch({
        type: 'method',
        params: {
          method: 'backfillAccountOpBalanceChanges',
          args: [submittedAccountOp]
        }
      })
    }

    openBottomSheet()
  }

  const [bindAnim, animStyle] = useMultiHover({
    values: [
      {
        property: 'backgroundColor',
        from: theme.secondaryBackground,
        to: theme.tertiaryBackground
      }
    ]
  })

  if (!network) return null

  return (
    <>
      <AnimatedPressable
        onPress={handleOpenDetails}
        style={[
          styles.container,
          style,
          {
            paddingTop: SPACING_SM * sizeMultiplier[size]
          },
          animStyle
        ]}
        {...bindAnim}
      >
        <SubmittedTransactionHeader
          submittedAccountOp={submittedAccountOp}
          network={network}
          size={size}
        />
        <View
          style={[
            spacings.mvSm,
            spacings.mhSm,
            {
              height: 1,
              backgroundColor: theme.secondaryBorder
            }
          ]}
        />
        <View style={styles.contentContainer}>
          <View
            style={[
              styles.dappInteractionsColumn,
              shouldShowBalanceChangesSummary ? spacings.mrSm : undefined
            ]}
          >
            {dappInteractions.length ? (
              <>
                {dappInteractions.map((interaction, index) => (
                  <View
                    key={interaction.id}
                    style={[
                      styles.dappInteractionRow,
                      index < dappInteractions.length - 1 ? spacings.mbTy : undefined
                    ]}
                  >
                    <DappInteractionIcon interaction={interaction} />
                    <Text fontSize={14} weight="semiBold">
                      {interaction.name}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <SkeletonLoader width={120} height={18} />
            )}
          </View>
          {shouldShowBalanceChangesSummary && (
            <View style={styles.balanceChangesRightColumn}>
              {visibleBalanceChanges.map((change, index) => (
                <View
                  key={`${change.address}-${change.balanceChange.toString()}`}
                  style={[
                    styles.balanceChangeRow,
                    index < visibleBalanceChanges.length - 1 || hiddenBalanceChangesCount
                      ? spacings.mbTy
                      : null
                  ]}
                >
                  <Text
                    fontSize={12}
                    weight="medium"
                    appearance={change.balanceChange > 0n ? 'successText' : 'errorText'}
                    // @ts-ignore
                    style={{ cursor: 'pointer' }}
                    dataSet={createGlobalTooltipDataSet({
                      id: getBalanceChangeTooltipId(change, submittedAccountOp),
                      content: getFullBalanceChangeAmount(change)
                    })}
                  >
                    {formatBalanceChangeAmount(change)}
                  </Text>
                  <Text
                    fontSize={12}
                    weight="medium"
                    appearance="secondaryText"
                    style={spacings.mlTy}
                  >
                    {change.symbol}
                  </Text>
                  <BalanceChangeToken change={change} />
                </View>
              ))}
              {!!hiddenBalanceChangesCount && (
                <Text fontSize={12} appearance="secondaryText">
                  +{hiddenBalanceChangesCount} more
                </Text>
              )}
            </View>
          )}
        </View>
      </AnimatedPressable>
      <BottomSheet
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        type={modalType}
        adjustToContentHeight={false}
        style={{
          maxWidth: 720,
          paddingVertical: 0,
          paddingHorizontal: 0,
          overflow: 'hidden'
        }}
        customRenderer={
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <Pressable
                onPress={() => {
                  closeBottomSheet()
                }}
                style={styles.sheetHeaderBackButton}
              >
                <LeftArrowIcon color={theme.secondaryText} />
              </Pressable>
              <Text fontSize={16} weight="semiBold" style={styles.sheetHeaderTitle}>
                Activity information
              </Text>
              <View style={styles.sheetHeaderBackButton} />
            </View>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetScrollContent}
            >
              <SubmittedTransactionSummaryDetails
                submittedAccountOp={submittedAccountOp}
                network={network}
                size={size}
                defaultType={defaultType}
              />
            </ScrollView>
            <Footer
              size={size}
              network={network}
              rawCalls={submittedAccountOp.calls}
              submittedAccountOp={submittedAccountOp}
              txnId={submittedAccountOp.txnId}
              identifiedBy={submittedAccountOp.identifiedBy}
              accountAddr={submittedAccountOp.accountAddr}
              gasFeePayment={submittedAccountOp.gasFeePayment}
              status={getPresentationalStatus(submittedAccountOp)}
            />
          </View>
        }
      />
    </>
  )
}

const SubmittedTransactionSummary = ({
  submittedAccountOp,
  size = 'lg',
  style,
  modalType = 'bottom-sheet'
}: Props) => {
  return (
    <>
      {[submittedAccountOp].map((op) => (
        <SubmittedTransactionSummaryInner
          key={op.id || op.txnId}
          submittedAccountOp={op}
          size={size}
          style={style}
          defaultType="full-info"
          modalType={modalType}
        />
      ))}
    </>
  )
}

export default React.memo(SubmittedTransactionSummary)

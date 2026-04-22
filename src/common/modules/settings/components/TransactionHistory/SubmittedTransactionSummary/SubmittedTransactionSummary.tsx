/* eslint-disable @typescript-eslint/no-floating-promises */
import { formatUnits, ZeroAddress } from 'ethers'
import React, { useMemo } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { Network } from '@ambire-common/interfaces/network'
import {
  BalanceChange,
  isIdentifiedByMultipleTxn,
  SubmittedAccountOp
} from '@ambire-common/libs/accountOp/submittedAccountOp'
import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import { humanizeAccountOp } from '@ambire-common/libs/humanizer'
import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import AmbireLogoSquare from '@common/assets/svg/AmbireLogoSquare'
import BungeeIcon from '@common/assets/svg/BungeeIcon/BungeeIcon'
import LiFiIcon from '@common/assets/svg/LiFiIcon/LiFiIcon'
import BottomSheet from '@common/components/BottomSheet'
import NetworkIcon from '@common/components/NetworkIcon'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import PendingTokenSummary from '@common/modules/sign-account-op/components/PendingTokenSummary'
import TransactionSummary, {
  sizeMultiplier
} from '@common/modules/sign-account-op/components/TransactionSummary'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
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
}

type DappInteraction = {
  id: string
  name: string
  iconUrl?: string | null
  iconType?: 'lifi' | 'socket' | 'ambire'
}

const formatBalanceChangeAmount = (change: BalanceChange) => {
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

const BalanceChangeToken = ({ change }: { change: BalanceChange }) => (
  <View style={spacings.mlMi}>
    <TokenIcon
      width={14}
      height={14}
      withContainer
      containerHeight={16}
      containerWidth={16}
      withNetworkIcon={false}
      address={change.address}
      chainId={change.chainId}
    />
  </View>
)

const DappInteractionIcon = ({ interaction }: { interaction: DappInteraction }) => {
  if (interaction.iconType === 'lifi') return <LiFiIcon width={18} height={18} />
  if (interaction.iconType === 'socket') return <BungeeIcon width={18} height={18} />
  if (interaction.iconType === 'ambire') return <AmbireLogoSquare width={18} height={18} />

  const fallbackInitial = interaction.name.trim().charAt(0).toUpperCase() || '?'

  return (
    <ManifestImage
      uri={interaction.iconUrl || ''}
      size={18}
      isRound
      fallback={() => (
        <View style={stylesForIcons.fallbackIcon}>
          <Text fontSize={11} weight="medium" appearance="secondaryText">
            {fallbackInitial}
          </Text>
        </View>
      )}
      imageStyle={stylesForIcons.manifestImage}
    />
  )
}

const stylesForIcons = {
  fallbackIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center'
  },
  manifestImage: {
    backgroundColor: 'transparent'
  }
} as const

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

const getBalanceChangeLabel = (submittedAccountOp: SubmittedAccountOp, change: BalanceChange) => {
  if (change.balanceChange > 0n) return 'Received'

  const isSelfPaidNativeFee =
    submittedAccountOp.gasFeePayment?.inToken === ZeroAddress &&
    submittedAccountOp.gasFeePayment?.paidBy.toLowerCase() ===
      submittedAccountOp.accountAddr.toLowerCase() &&
    change.address.toLowerCase() === ZeroAddress.toLowerCase()

  if (!isSelfPaidNativeFee) return 'Sent'

  const hasCallsWithNativeValue = submittedAccountOp.calls.some((call) => call.value > 0n)

  return hasCallsWithNativeValue ? 'Sent + Gas' : 'Gas'
}

const getHumanizedCalls = (submittedAccountOp: SubmittedAccountOp): IrCall[] =>
  humanizeAccountOp(submittedAccountOp).map((call, index) => ({
    ...call,
    id: call.id || String(index)
  }))

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
      iconType: 'ambire'
    })
  }

  if (!interactions.length) {
    addInteraction({
      id: 'fallback:transfer',
      name: 'Transfer',
      iconType: 'ambire'
    })
  }

  return interactions
}

const SubmittedTransactionHeader = ({
  submittedAccountOp,
  size
}: {
  submittedAccountOp: SubmittedAccountOp
  size: 'sm' | 'md' | 'lg'
}) => {
  const { styles } = useTheme(getStyles)
  const submittedDate = useMemo(
    () => new Date(submittedAccountOp.timestamp),
    [submittedAccountOp.timestamp]
  )

  return (
    <View
      style={[styles.header, spacings.phSm, { marginBottom: SPACING_SM * sizeMultiplier[size] }]}
    >
      <StatusBadge status={submittedAccountOp.status} textSize={14 * sizeMultiplier[size]} />
      <View style={styles.headerMeta}>
        {submittedDate.toString() !== 'Invalid Date' && (
          <Text fontSize={14 * sizeMultiplier[size]} appearance="secondaryText">
            {`${submittedDate.toLocaleDateString()} (${submittedDate.toLocaleTimeString()})`}
          </Text>
        )}
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
  const { styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const humanizedCalls = useMemo(() => getHumanizedCalls(submittedAccountOp), [submittedAccountOp])
  const orderedBalanceChanges = useMemo(
    () => getOrderedBalanceChanges(submittedAccountOp),
    [submittedAccountOp]
  )
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
    <View
      style={[
        styles.container,
        {
          paddingTop: SPACING_SM * sizeMultiplier[size]
        }
      ]}
    >
      <SubmittedTransactionHeader submittedAccountOp={submittedAccountOp} size={size} />
      {!isDelegationTxn &&
        humanizedCalls.map((call: IrCall) => (
          <TransactionSummary
            key={call.id}
            style={{ ...styles.summaryItem, marginBottom: SPACING_SM * sizeMultiplier[size] }}
            call={call}
            chainId={submittedAccountOp.chainId}
            type="history"
            enableExpand={defaultType === 'full-info'}
            size={size}
            hideLinks
          />
        ))}
      {!isDelegationTxn && !humanizedCalls.length && (
        <View style={spacings.phSm}>
          <SkeletonLoader width="100%" height={112} />
        </View>
      )}
      {isDelegationTxn && (
        <View style={[spacings.phSm, spacings.pbSm]}>
          <DelegationHumanization
            setDelegation={submittedAccountOp.meta?.setDelegation}
            delegatedContract={submittedAccountOp.meta?.delegation?.address}
            isBorderless
          />
        </View>
      )}
      {!!(assetsOut.length || assetsIn.length) && (
        <View style={[styles.modalBalanceChangesSection, spacings.phSm, spacings.pbSm]}>
          <View style={[flexbox.directionRow, flexbox.flex1]}>
            {!!assetsOut.length && renderBalanceChangesCard('Assets out', assetsOut)}
            {!!assetsIn.length && renderBalanceChangesCard('Assets in', assetsIn)}
          </View>
        </View>
      )}
      <Footer
        size={size}
        network={network}
        rawCalls={submittedAccountOp.calls}
        submittedAccountOp={submittedAccountOp}
        txnId={submittedAccountOp.txnId}
        identifiedBy={submittedAccountOp.identifiedBy}
        accountAddr={submittedAccountOp.accountAddr}
        gasFeePayment={submittedAccountOp.gasFeePayment}
        status={submittedAccountOp.status}
      />
    </View>
  )
}

const SubmittedTransactionSummaryInner = ({
  submittedAccountOp,
  size = 'lg',
  style,
  defaultType
}: Props) => {
  const { styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const { networks } = useController('NetworksController').state
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  const network: Network | undefined = useMemo(
    () => networks.find((n) => n.chainId === submittedAccountOp.chainId),
    [networks, submittedAccountOp.chainId]
  )
  const orderedBalanceChanges = useMemo(
    () => getOrderedBalanceChanges(submittedAccountOp),
    [submittedAccountOp]
  )
  const shouldShowBalanceChangesSummary =
    submittedAccountOp.status === AccountOpStatus.Success && orderedBalanceChanges.length > 0
  const dappInteractions = useMemo(
    () => getDappInteractions(submittedAccountOp),
    [submittedAccountOp]
  )

  if (!network) return null

  return (
    <>
      <Pressable onPress={openBottomSheet}>
        <View
          style={[
            styles.container,
            style,
            {
              paddingTop: SPACING_SM * sizeMultiplier[size]
            }
          ]}
        >
          <SubmittedTransactionHeader submittedAccountOp={submittedAccountOp} size={size} />
          <View style={styles.contentContainer}>
            <View
              style={[
                styles.dappInteractionsColumn,
                shouldShowBalanceChangesSummary ? spacings.mrSm : undefined
              ]}
            >
              {dappInteractions.length ? (
                dappInteractions.map((interaction, index) => (
                  <View
                    key={interaction.id}
                    style={[
                      styles.dappInteractionRow,
                      index < dappInteractions.length - 1 ? spacings.mbTy : null
                    ]}
                  >
                    <DappInteractionIcon interaction={interaction} />
                    <Text fontSize={12} appearance="secondaryText" style={spacings.mlMi}>
                      {interaction.name}
                    </Text>
                  </View>
                ))
              ) : (
                <SkeletonLoader width={120} height={18} />
              )}
            </View>
            {shouldShowBalanceChangesSummary && (
              <View style={styles.balanceChangesRightColumn}>
                {orderedBalanceChanges.map((change, index) => (
                  <View
                    key={`${change.address}-${change.balanceChange.toString()}`}
                    style={[
                      styles.balanceChangeRow,
                      index < orderedBalanceChanges.length - 1 ? spacings.mbTy : null
                    ]}
                  >
                    <Text fontSize={12} appearance="secondaryText">
                      {t(getBalanceChangeLabel(submittedAccountOp, change))}{' '}
                    </Text>
                    <Text
                      fontSize={12}
                      weight="medium"
                      appearance={change.balanceChange > 0n ? 'successText' : 'errorText'}
                    >
                      {formatBalanceChangeAmount(change)}
                    </Text>
                    <BalanceChangeToken change={change} />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Pressable>
      <BottomSheet
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        type="modal"
        style={{ maxWidth: 720, paddingHorizontal: 0, overflow: 'hidden' }}
      >
        <SubmittedTransactionSummaryDetails
          submittedAccountOp={submittedAccountOp}
          network={network}
          size={size}
          defaultType={defaultType}
        />
      </BottomSheet>
    </>
  )
}

const SubmittedTransactionSummary = ({ submittedAccountOp, size = 'lg', style }: Props) => {
  const accountOpDividedIntoMultipleIfNeeded = isIdentifiedByMultipleTxn(
    submittedAccountOp.identifiedBy
  )
    ? submittedAccountOp.calls.reverse().map((call) => {
        return {
          ...submittedAccountOp,
          txnId: call.txnId,
          status: call.status,
          calls: [call],
          gasFeePayment: submittedAccountOp.gasFeePayment
            ? {
                ...submittedAccountOp.gasFeePayment,
                inToken: call.fee?.inToken
                  ? call.fee?.inToken
                  : submittedAccountOp.gasFeePayment.inToken,
                amount: call.fee?.amount
                  ? call.fee?.amount
                  : submittedAccountOp.gasFeePayment.amount
              }
            : null
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
          defaultType="full-info"
        />
      ))}
    </>
  )
}

export default React.memo(SubmittedTransactionSummary)

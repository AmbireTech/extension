import { formatUnits, ZeroAddress } from 'ethers'
import React, { useEffect, useMemo, useState } from 'react'
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
import AmbireLogo from '@common/assets/svg/AmbireLogo'
import BottomSheet from '@common/components/BottomSheet'
import NetworkIcon from '@common/components/NetworkIcon'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import PendingTokenSummary from '@common/modules/sign-account-op/components/PendingTokenSummary'
import TransactionSummary, { sizeMultiplier } from '@common/modules/sign-account-op/components/TransactionSummary'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { checkIfImageExists } from '@common/utils/checkIfImageExists'
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
  iconType?: 'ambire'
}

const MAX_VISIBLE_DAPP_INTERACTIONS = 2
const MAX_VISIBLE_BALANCE_CHANGES = 3
const dappIconAvailabilityCache = new Map<string, boolean>()

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

  if (interaction.iconType === 'ambire') {
    return (
      <View style={stylesForIcons.ambireIcon}>
        <AmbireLogo width={12} height={20} />
      </View>
    )
  }

  if (!interaction.iconUrl || !hasIcon) return null

  return (
    <ManifestImage
      uri={interaction.iconUrl}
      size={20}
      isRound
      imageStyle={stylesForIcons.manifestImage}
    />
  )
}

const stylesForIcons = {
  manifestImage: {
    backgroundColor: 'transparent'
  },
  ambireIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center'
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
    <View
      style={[styles.header, spacings.phSm, { marginBottom: SPACING_SM * sizeMultiplier[size] }]}
    >
      <StatusBadge status={submittedAccountOp.status} textSize={14 * sizeMultiplier[size]} />
      <View style={styles.headerMeta}>
        <Text fontSize={14 * sizeMultiplier[size]} appearance="secondaryText">
          {submittedDate}
        </Text>
        <Text fontSize={14 * sizeMultiplier[size]} appearance="secondaryText" style={spacings.mlTy}>
          on {network.name}
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
    <View style={[styles.container, spacings.ptXl]}>
      <SubmittedTransactionHeader
        submittedAccountOp={submittedAccountOp}
        network={network}
        size={size}
      />
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
  const { dispatch: activityDispatch } = useController('ActivityController')
  const { networks } = useController('NetworksController').state
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { theme } = useTheme()

  const network: Network | undefined = useMemo(
    () => networks.find((n) => n.chainId === submittedAccountOp.chainId),
    [networks, submittedAccountOp.chainId]
  )
  const orderedBalanceChanges = useMemo(
    () => getOrderedBalanceChanges(submittedAccountOp),
    [submittedAccountOp]
  )
  const visibleBalanceChanges = useMemo(
    () => orderedBalanceChanges.slice(0, MAX_VISIBLE_BALANCE_CHANGES),
    [orderedBalanceChanges]
  )
  const hiddenBalanceChangesCount = Math.max(
    orderedBalanceChanges.length - MAX_VISIBLE_BALANCE_CHANGES,
    0
  )
  const shouldShowBalanceChangesSummary =
    submittedAccountOp.status === AccountOpStatus.Success && orderedBalanceChanges.length > 0
  const dappInteractions = useMemo(
    () => getDappInteractions(submittedAccountOp),
    [submittedAccountOp]
  )
  const visibleDappInteractions = useMemo(
    () => dappInteractions.slice(0, MAX_VISIBLE_DAPP_INTERACTIONS),
    [dappInteractions]
  )
  const hiddenDappInteractionsCount = Math.max(
    dappInteractions.length - MAX_VISIBLE_DAPP_INTERACTIONS,
    0
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

  if (!network) return null

  return (
    <>
      <Pressable onPress={handleOpenDetails}>
        <View
          style={[
            styles.container,
            style,
            {
              paddingTop: SPACING_SM * sizeMultiplier[size]
            }
          ]}
        >
          <SubmittedTransactionHeader
            submittedAccountOp={submittedAccountOp}
            network={network}
            size={size}
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
                  {visibleDappInteractions.map((interaction, index) => (
                    <View
                      key={interaction.id}
                      style={[
                        styles.dappInteractionRow,
                        index < visibleDappInteractions.length - 1 || hiddenDappInteractionsCount
                          ? spacings.mbTy
                          : undefined
                      ]}
                    >
                      <DappInteractionIcon interaction={interaction} />
                      <Text fontSize={12} appearance="secondaryText" style={spacings.mlMi}>
                        {interaction.name}
                      </Text>
                    </View>
                  ))}
                  {!!hiddenDappInteractionsCount && (
                    <Text fontSize={12} appearance="secondaryText">
                      +{hiddenDappInteractionsCount} more
                    </Text>
                  )}
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
                    >
                      {formatBalanceChangeAmount(change)}
                    </Text>
                    <Text fontSize={12} appearance="secondaryText" style={spacings.mlTy}>
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
        </View>
      </Pressable>
      <BottomSheet
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        type="bottom-sheet"
        style={{
          maxWidth: 720,
          paddingVertical: 0,
          paddingHorizontal: 0,
          overflow: 'hidden',
          backgroundColor: theme.secondaryBackground
        }}
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

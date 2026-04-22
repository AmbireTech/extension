/* eslint-disable @typescript-eslint/no-floating-promises */
import { formatUnits } from 'ethers'
import React, { useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { Network } from '@ambire-common/interfaces/network'
import {
  BalanceChange,
  isIdentifiedByMultipleTxn,
  SubmittedAccountOp
} from '@ambire-common/libs/accountOp/submittedAccountOp'
import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import AmbireLogoSquare from '@common/assets/svg/AmbireLogoSquare'
import BungeeIcon from '@common/assets/svg/BungeeIcon/BungeeIcon'
import LiFiIcon from '@common/assets/svg/LiFiIcon/LiFiIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import { sizeMultiplier } from '@common/modules/sign-account-op/components/TransactionSummary'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import ManifestImage from '@web/components/ManifestImage'

import Footer from './Footer'
import StatusBadge from './StatusBadge'
import getStyles from './styles'

interface Props {
  submittedAccountOp: SubmittedAccountOp
  style?: ViewStyle
  size?: 'sm' | 'md' | 'lg'
  // The primary difference is the ability to expand and view raw transaction details in 'full-info'. All other features are identical.
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

const SubmittedTransactionSummaryInner = ({ submittedAccountOp, size = 'lg', style }: Props) => {
  const { styles } = useTheme(getStyles)
  const { networks } = useController('NetworksController').state
  const { t } = useTranslation()
  const submittedDate = useMemo(
    () => new Date(submittedAccountOp.timestamp),
    [submittedAccountOp.timestamp]
  )

  const network: Network | undefined = useMemo(
    () => networks.find((n) => n.chainId === submittedAccountOp.chainId),
    [networks, submittedAccountOp.chainId]
  )
  const balanceChanges = useMemo(
    () => submittedAccountOp.balanceChanges || [],
    [submittedAccountOp.balanceChanges]
  )
  const shouldShowBalanceChangesSummary =
    submittedAccountOp.status === AccountOpStatus.Success && balanceChanges.length > 0
  const orderedBalanceChanges = useMemo(() => {
    const positiveChanges = balanceChanges.filter((change) => change.balanceChange > 0n)
    const negativeChanges = balanceChanges.filter((change) => change.balanceChange < 0n)

    return [...positiveChanges, ...negativeChanges]
  }, [balanceChanges])
  const dappInteractions = useMemo(() => {
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

    const isSwapBridge = !!submittedAccountOp.meta?.swapTxn
    if (isSwapBridge) {
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
  }, [submittedAccountOp.calls, submittedAccountOp.meta?.swapTxn])

  if (!network) return null

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
                  {change.balanceChange > 0n ? t('Received') : t('Sent')}{' '}
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
    ? submittedAccountOp.calls.reverse().map((call) => {
        return {
          ...submittedAccountOp,
          txnId: call.txnId,
          status: call.status,
          calls: [call],
          // if the call has a fee set, use it
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
          defaultType={defaultType}
        />
      ))}
    </>
  )
}

export default React.memo(SubmittedTransactionSummary)

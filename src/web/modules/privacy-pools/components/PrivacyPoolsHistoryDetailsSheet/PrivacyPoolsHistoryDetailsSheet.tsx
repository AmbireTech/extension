import { formatUnits } from 'ethers'
import React, { FC, ReactNode, useCallback, useMemo } from 'react'
import { Pressable, View } from 'react-native'

import { getPrivacyPoolsAsset } from '@ambire-common/consts/privacyPools'
import { Network } from '@ambire-common/interfaces/network'
import {
  PrivacyPoolsHistoryEntry,
  PrivacyPoolsHistoryEntryType
} from '@ambire-common/interfaces/privacyPools'
import CopyIcon from '@common/assets/svg/CopyIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import {
  getFormattedSubmittedDate,
  getTruncatedTxnHash
} from '@common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary/helpers'
import InteractionAddress from '@common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary/InteractionAddress'
import getSummaryStyles from '@common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary/styles'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import { setStringAsync } from '@common/utils/clipboard'
import { openInTab } from '@common/utils/links'
import { getUiType } from '@common/utils/uiType'

import type { Modalize } from 'react-native-modalize'

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  entry: PrivacyPoolsHistoryEntry
  network: Network
}

const { isTab } = getUiType()

// As the regular activity's `SummaryDetailsSheet`, hoisted to keep `BottomSheet`'s memo
const SHEET_STYLE = {
  maxWidth: 720,
  paddingVertical: 0,
  paddingHorizontal: 0,
  overflow: 'hidden'
} as const
const SCROLL_WRAPPER_STYLE = isWeb ? { paddingLeft: SPACING_TY } : undefined

const AMOUNT_LABELS: { [type in PrivacyPoolsHistoryEntryType]: string } = {
  deposit: 'Received',
  withdrawal: 'Sent',
  ragequit: 'Taken back'
}

/**
 * The details of one event of a Privacy Pools account's history, as the regular activity's
 * `SummaryDetailsSheet` shows a transaction's. Only what this device synced: reading the
 * transaction from the network would tell it which one is the user's. For the same reason the
 * explorer opens only on its own button, under a warning.
 */
const PrivacyPoolsHistoryDetailsSheet: FC<Props> = ({
  sheetRef,
  closeBottomSheet,
  entry,
  network
}) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getSummaryStyles)
  const { addToast } = useToast()

  // A pool added before we list it: the raw amount rather than nothing, as in the balances
  const asset = getPrivacyPoolsAsset(BigInt(entry.chainId), entry.tokenAddress)
  const symbol = asset?.symbol || t('Unknown token')
  const fullAmount = formatUnits(entry.amount, asset?.decimals ?? 0)
  const isIncoming = entry.type === 'deposit'
  const submittedDate = useMemo(() => getFormattedSubmittedDate(entry.timestamp), [entry.timestamp])
  const explorerUrl = network.explorerUrl?.endsWith('/')
    ? network.explorerUrl.slice(0, -1)
    : network.explorerUrl
  // Missing for an event this device synced before transaction hashes were kept
  const explorerLink = entry.txnId && explorerUrl ? `${explorerUrl}/tx/${entry.txnId}` : null

  const copy = useCallback(
    async (value: string) => {
      try {
        await setStringAsync(value)
        addToast(t('Copied to clipboard!'), { timeout: 2500 })
      } catch (error: any) {
        addToast(error?.message || t('Could not copy it. Please try again.'), { type: 'error' })
      }
    },
    [addToast, t]
  )

  const openExplorer = useCallback(async () => {
    if (!explorerLink) return

    try {
      await openInTab({ url: explorerLink })
    } catch (error: any) {
      addToast(error?.message || t('Could not open the transaction.'), { type: 'error' })
    }
  }, [addToast, explorerLink, t])

  const headerComponent = useMemo(
    () => (
      <View style={styles.sheetHeader}>
        <ModalHeader title={t('Activity information')} handleClose={closeBottomSheet} />
      </View>
    ),
    [closeBottomSheet, styles.sheetHeader, t]
  )

  const footerComponent = useMemo(() => {
    if (!explorerLink) return undefined

    return (
      <View style={styles.footer}>
        <Alert
          type="warning"
          size="sm"
          titleWeight="regular"
          title={t(
            'The explorer will see which transaction you open, which could link this activity to you.'
          )}
          style={spacings.mbSm}
        />
        <Button
          text={t('Open explorer')}
          type="outline"
          size="smaller"
          onPress={openExplorer}
          hasBottomSpacing={false}
          style={styles.footerButton}
          childrenPosition="left"
        >
          <OpenIcon style={spacings.mrMi} width={20} height={20} />
        </Button>
      </View>
    )
  }, [explorerLink, openExplorer, styles.footer, styles.footerButton, t])

  const scrollViewProps = useMemo(
    () => ({ contentContainerStyle: styles.sheetScrollContent }),
    [styles.sheetScrollContent]
  )

  const renderRow = (label: string, value: ReactNode, testID: string) => (
    <View style={[styles.modalStepRow, spacings.mbSm]} testID={testID}>
      <Text appearance="tertiaryText" weight="medium" style={spacings.mrSm}>
        {label}
      </Text>
      <View style={[styles.modalStepRowRight, { flexShrink: 1 }]}>{value}</View>
    </View>
  )

  const renderCopyButton = (value: string) => (
    <Pressable onPress={() => copy(value)} style={styles.modalHashCopyButton}>
      <CopyIcon width={16} height={16} color={theme.primaryText} />
    </Pressable>
  )

  const getReviewStatus = () => {
    if (entry.status === 'pending')
      return { text: t('Being verified'), appearance: 'warningText' as const }
    if (entry.status === 'approved')
      return { text: t('Approved'), appearance: 'successText' as const }

    // Taken back, or newer than the notes it was checked against: not known yet
    return null
  }

  const reviewStatus = getReviewStatus()

  return (
    <BottomSheet
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      type={isTab ? 'modal' : 'bottom-sheet'}
      adjustToContentHeight={false}
      HeaderComponent={headerComponent}
      FooterComponent={footerComponent}
      scrollViewProps={scrollViewProps}
      containerInnerWrapperStyles={SCROLL_WRAPPER_STYLE}
      reserveScrollPadding
      style={SHEET_STYLE}
    >
      <View style={spacings.phSm}>
        {renderRow(
          t(AMOUNT_LABELS[entry.type]),
          <>
            <Text
              fontSize={14}
              weight="medium"
              appearance={isIncoming ? 'successText' : 'errorText'}
              selectable
            >
              {`${isIncoming ? '+' : '-'}${fullAmount} ${symbol}`}
            </Text>
            <View style={spacings.mlTy}>
              <TokenIcon
                width={13}
                height={13}
                withContainer
                containerHeight={16}
                containerWidth={16}
                withNetworkIcon={false}
                address={entry.tokenAddress}
                chainId={BigInt(entry.chainId)}
              />
            </View>
          </>,
          'privacy-pools-history-amount'
        )}
        {entry.type === 'withdrawal' && (
          <Text
            fontSize={12}
            appearance="secondaryText"
            style={[spacings.mbSm, { marginTop: -SPACING_TY }]}
          >
            {t(
              'This is what left your account, including the fee. The recipient got a little less.'
            )}
          </Text>
        )}
        {!!reviewStatus &&
          renderRow(
            t('Verification'),
            <Text fontSize={14} weight="medium" appearance={reviewStatus.appearance}>
              {reviewStatus.text}
            </Text>,
            'privacy-pools-history-review'
          )}
        {!!entry.counterpartyAddr &&
          renderRow(
            isIncoming ? t('From') : t('To'),
            <>
              {/* Named from this device only, as in `PrivacyPoolsHistoryItem` */}
              <InteractionAddress address={entry.counterpartyAddr} privacyUpdateMode="never" />
              {renderCopyButton(entry.counterpartyAddr)}
            </>,
            'privacy-pools-history-address'
          )}
        {renderRow(
          t('Date'),
          <>
            {/* Approximate: worked out from nearby blocks, without asking the network about this
            transaction, so it may be a few minutes off */}
            <Text fontSize={14} appearance="secondaryText" style={{ flexShrink: 1 }}>
              {t('≈ {{date}} on {{network}}', { date: submittedDate, network: network.name })}
            </Text>
            <NetworkIcon id={entry.chainId} size={20} style={spacings.mlMi} />
          </>,
          'privacy-pools-history-date'
        )}
        {!!entry.txnId &&
          renderRow(
            t('Transaction hash'),
            <>
              <Text fontSize={14} appearance="secondaryText">
                {getTruncatedTxnHash(entry.txnId)}
              </Text>
              {renderCopyButton(entry.txnId)}
            </>,
            'privacy-pools-history-hash'
          )}
      </View>
    </BottomSheet>
  )
}

export default React.memo(PrivacyPoolsHistoryDetailsSheet)

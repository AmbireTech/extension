import type { FC } from 'react'
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, LayoutChangeEvent, View } from 'react-native'

import { isSafeRejectionCall } from '@ambire-common/libs/accountOp/accountOp'
import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import PendingCancellationRow from './PendingCancellationRow'
import PendingTransactionBundle from './PendingTransactionBundle'
import getStyles from './styles'

import type { SafeQueueNetworkGroup } from '@common/modules/dashboard/hooks/usePendingSafeTransactions/usePendingSafeTransactions'
interface Props {
  group: SafeQueueNetworkGroup
  currentNonce: bigint | undefined
}

/**
 * Lists the pending Safe transactions of a single chain. Only one nonce is displayed at a
 * time (the smallest one by default). When the chain has more than one pending nonce, the
 * arrows next to the nonce in the header switch to the previous/next one.
 */
const PendingChainTransactions: FC<Props> = ({ group, currentNonce }) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  // The cancellation covers every transaction of the nonce, so hovering it outlines the whole
  // container in red. The border color fades in and out.
  const [cancellationHoverAnim] = useState(() => new Animated.Value(0))
  const handleCancellationHoverChange = useCallback(
    (isHovered: boolean) => {
      Animated.timing(cancellationHoverAnim, {
        toValue: isHovered ? 1 : 0,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false
      }).start()
    },
    [cancellationHoverAnim]
  )
  const chainBorderColor = cancellationHoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.neutral600 as string, theme.errorDecorative as string]
  })
  const [manuallySelectedNonceIndex, setManuallySelectedNonceIndex] = useState<number | null>(null)

  // Until the user navigates, the nonce that executes next is displayed. Falls back to the
  // smallest pending nonce, both while the account state loads and when the queue holds
  // nothing on the current nonce
  const defaultNonceIndex = useMemo(() => {
    const currentNonceIndex = group.nonceGroups.findIndex(({ nonce }) => nonce === currentNonce)

    return currentNonceIndex === -1 ? 0 : currentNonceIndex
  }, [currentNonce, group.nonceGroups])

  // The nonce groups shrink as transactions get executed or rejected, so the selected index
  // is clamped instead of stored, to never point outside of the currently available nonces
  const nonceIndex = Math.min(
    manuallySelectedNonceIndex ?? defaultNonceIndex,
    group.nonceGroups.length - 1
  )
  const nonceGroup = group.nonceGroups[nonceIndex]
  const isCurrentNonce = !!nonceGroup && nonceGroup.nonce === currentNonce
  const waitsForPrecedingNonce =
    !!nonceGroup && currentNonce !== undefined && nonceGroup.nonce > currentNonce
  // The nonce that executes next is the actionable one; a later nonce is marked as a warning,
  // because nothing on it can happen before the nonces in front of it are done
  let nonceColor
  if (isCurrentNonce) nonceColor = theme.primaryAccent
  else if (waitsForPrecedingNonce) nonceColor = theme.warningText
  // A cancellation replaces every transaction on its nonce, so it is not listed as a
  // transaction of its own. A row below the transactions stands for it instead.
  const { transactionRequests, cancellationRequest, transactionToCancel } = useMemo(() => {
    const requests = nonceGroup?.requests ?? []
    const isCancellation = (request: (typeof requests)[number]) =>
      isSafeRejectionCall(
        request.signAccountOp.accountOp.calls,
        request.signAccountOp.accountOp.accountAddr
      )
    const getSignedCount = (request: (typeof requests)[number]) =>
      new Set((request.signAccountOp.accountOp.signed || []).map((addr) => addr.toLowerCase())).size

    // Should several cancellations exist, the one closest to being executed represents them
    const cancellations = requests
      .filter(isCancellation)
      .sort((a, b) => getSignedCount(b) - getSignedCount(a))

    const transactions = requests.filter((request) => !isCancellation(request))
    // The cancellation gets prepared from the transaction that has collected the most signatures
    const [transactionToCancel] = [...transactions].sort(
      (a, b) => getSignedCount(b) - getSignedCount(a)
    )

    return {
      transactionRequests: transactions,
      cancellationRequest: cancellations[0] as (typeof requests)[number] | undefined,
      transactionToCancel
    }
  }, [nonceGroup])
  const hasPrevNonce = nonceIndex > 0
  const hasNextNonce = nonceIndex < group.nonceGroups.length - 1

  const handlePrevNonce = useCallback(() => {
    setManuallySelectedNonceIndex(Math.max(nonceIndex - 1, 0))
  }, [nonceIndex])

  const handleNextNonce = useCallback(() => {
    setManuallySelectedNonceIndex(Math.min(nonceIndex + 1, group.nonceGroups.length - 1))
  }, [nonceIndex, group.nonceGroups.length])

  // Nonces hold a different number of transactions, so the container height is animated
  // to the height of the displayed nonce, instead of jumping and pushing the list around
  const [animatedHeight] = useState(() => new Animated.Value(0))
  const measuredHeightRef = useRef<number | null>(null)

  const handleContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout
      if (measuredHeightRef.current === height) return

      const isFirstMeasurement = measuredHeightRef.current === null
      measuredHeightRef.current = height

      if (isFirstMeasurement) {
        animatedHeight.setValue(height)
        return
      }

      Animated.timing(animatedHeight, {
        toValue: height,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false
      }).start()
    },
    [animatedHeight]
  )

  useEffect(() => {
    return () => {
      animatedHeight.stopAnimation()
      cancellationHoverAnim.stopAnimation()
    }
  }, [animatedHeight, cancellationHoverAnim])

  const renderOrDivider = () => (
    <View pointerEvents="none" style={styles.orDividerAnchor}>
      <View style={[styles.orDividerRow, flexbox.directionRow, flexbox.alignCenter]}>
        <View style={[styles.orDividerLine, flexbox.flex1]} />
        <View style={[styles.orDividerPill, flexbox.center, spacings.phTy, spacings.mhTy]}>
          <Text fontSize={11} weight="medium" color={theme.warningText}>
            {t('OR')}
          </Text>
        </View>
        <View style={[styles.orDividerLine, flexbox.flex1]} />
      </View>
    </View>
  )

  if (!nonceGroup) return null

  return (
    <Animated.View style={[styles.chainWrapper, spacings.mbSm, { borderColor: chainBorderColor }]}>
      <View
        style={[
          styles.chainHeader,
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.phSm,
          spacings.pvSm
        ]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <NetworkIcon id={group.network.chainId.toString()} size={24} />
          <Text fontSize={14} weight="semiBold" style={spacings.mlTy}>
            {group.network.name}
          </Text>
        </View>
        <View style={flexbox.alignEnd}>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            {/* The colon is kept out of the key, because i18next treats it as a namespace separator */}
            <Text fontSize={16} weight="semiBold">
              {t('Nonce')}:
            </Text>
            <HoverablePressable
              testID={`pending-transactions-prev-nonce-${group.network.chainId.toString()}`}
              accessibilityRole="button"
              accessibilityLabel={t('Show previous nonce')}
              accessibilityState={{ disabled: !hasPrevNonce }}
              disabled={!hasPrevNonce}
              onPress={handlePrevNonce}
              style={[
                styles.nonceNavigationButton,
                flexbox.center,
                spacings.mlTy,
                !hasPrevNonce && styles.nonceNavigationButtonDisabled
              ]}
            >
              <LeftArrowIcon width={6} height={11} color={theme.iconPrimary} />
            </HoverablePressable>
            <Text fontSize={16} weight="semiBold" color={nonceColor} style={spacings.mhTy}>
              {nonceGroup.nonce.toString()}
            </Text>
            <HoverablePressable
              testID={`pending-transactions-next-nonce-${group.network.chainId.toString()}`}
              accessibilityRole="button"
              accessibilityLabel={t('Show next nonce')}
              accessibilityState={{ disabled: !hasNextNonce }}
              disabled={!hasNextNonce}
              onPress={handleNextNonce}
              style={[
                styles.nonceNavigationButton,
                flexbox.center,
                !hasNextNonce && styles.nonceNavigationButtonDisabled
              ]}
            >
              <RightArrowIcon width={6} height={11} color={theme.iconPrimary} />
            </HoverablePressable>
          </View>
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtMi]}>
            {isCurrentNonce && (
              <View style={[styles.currentNoncePill, flexbox.center, spacings.phMi]}>
                <Text fontSize={11} weight="medium" color={theme.primaryAccent}>
                  {t('Next to execute')}
                </Text>
              </View>
            )}
            {waitsForPrecedingNonce && (
              <View style={[styles.futureNoncePill, flexbox.center, spacings.phMi]}>
                <Text fontSize={11} weight="medium" color={theme.warningText}>
                  {t('Waits for nonce {{nonce}}', { nonce: (nonceGroup.nonce - 1n).toString() })}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <Animated.View style={[styles.animatedContentWrapper, { height: animatedHeight }]}>
        {/* The bundles bring their own padding and span the box up to its border, so that
            the transaction summaries keep as much space as possible */}
        <View onLayout={handleContentLayout} style={styles.measuredContent}>
          {transactionRequests.map((request, index) => (
            <Fragment key={request.id}>
              {index > 0 && renderOrDivider()}
              <PendingTransactionBundle
                request={request}
                isCurrentNonce={isCurrentNonce}
                hasDividerAbove={index > 0}
                hasDividerBelow
              />
            </Fragment>
          ))}
          {transactionRequests.length > 0 && renderOrDivider()}
          <PendingCancellationRow
            cancellationRequest={cancellationRequest}
            transactionRequest={transactionToCancel}
            hasMultipleTransactions={transactionRequests.length > 1}
            onHoverChange={handleCancellationHoverChange}
          />
        </View>
      </Animated.View>
    </Animated.View>
  )
}

export default memo(PendingChainTransactions)

import { memo, ReactNode, useCallback, useMemo, useState } from 'react'
import { Image, Linking, ScrollView, StyleSheet, View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import gradient1560 from '@benzin/assets/images/gradient-1560.png'
import gradient1920 from '@benzin/assets/images/gradient-1920.png'
import gradient2560 from '@benzin/assets/images/gradient-2560.png'
import gradient780 from '@benzin/assets/images/gradient-780.png'
import Buttons from '@benzin/screens/BenzinScreen/components/Buttons'
import Header from '@benzin/screens/BenzinScreen/components/Header'
import Steps from '@benzin/screens/BenzinScreen/components/Steps'
import { shouldShowTxnProgress } from '@benzin/screens/BenzinScreen/components/Steps/utils/rows'
import useBenzin from '@benzin/screens/BenzinScreen/hooks/useBenzin'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useControllerStore from '@common/hooks/useControllerStore'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import ConfettiAnimation from '@common/modules/dashboard/components/ConfettiAnimation'
import TransactionSummary from '@common/modules/sign-account-op/components/TransactionSummary'
import spacings, { DEVICE_HEIGHT, DEVICE_WIDTH, SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'
import { isExtension } from '@web/constants/browserapi'

import { IS_MOBILE_UP_BENZIN_BREAKPOINT } from '../../styles'
import getStyles from './styles'

const { isSidePanel } = getUiType()

const Benzin = ({
  state,
  children,
  topContent
}: {
  state: ReturnType<typeof useBenzin>
  children?: ReactNode
  topContent?: ReactNode
}) => {
  const { styles } = useTheme(getStyles)
  const { maxWidthSize } = useWindowSize()
  const { isStoreReady } = useControllerStore()
  const insets = useSafeAreaInsets()
  // Side panel keeps the footer in the layout under the scroll view, so it stays at the bottom of
  // the screen. An absolute footer would need a spacer inside the scroll view, which creates a
  // phantom scrollbar when the steps are short.
  const needsFooterSpacer = !!children && !isMobile && !isSidePanel
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0)
  const [scrollContentHeight, setScrollContentHeight] = useState(0)
  const [viewSize, setViewSize] = useState({ width: 0, height: 0 })
  // Layers like confetti can inflate scroll height past the visible steps. Only allow scrolling in
  // the side panel when the measured content is actually taller than the viewport.
  const isSidePanelScrollEnabled =
    scrollViewportHeight > 0 && scrollContentHeight > scrollViewportHeight + 1

  const handleScrollViewLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      setScrollViewportHeight(event.nativeEvent.layout.height)
    },
    []
  )

  const handleScrollContentSizeChange = useCallback((_width: number, height: number) => {
    setScrollContentHeight(height)
  }, [])

  const handleViewLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = event.nativeEvent.layout
      setViewSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      )
    },
    []
  )

  const sizeStr = useMemo(() => {
    if (isMobile) return 'lg'
    if (IS_MOBILE_UP_BENZIN_BREAKPOINT) return 'md'
    return 'sm'
  }, [])

  const size = useMemo(() => {
    if (isMobile || IS_MOBILE_UP_BENZIN_BREAKPOINT) return 20
    return 14
  }, [])

  const identifiedByType =
    state?.stepsState?.submittedAccountOp?.identifiedBy?.type ||
    state?.stepsState?.extensionAccOp?.identifiedBy?.type
  const accountOp = state?.stepsState?.submittedAccountOp || state?.stepsState?.extensionAccOp
  const rawCalls = useMemo(() => accountOp?.calls, [accountOp?.calls])
  const disableOpenExplorerBtn = state?.disableOpenExplorerBtn

  const handleOpenCallExplorer = useCallback(
    async (callTxnId?: string) => {
      if (!callTxnId || !state?.network?.explorerUrl) return

      const explorerUrl = state.network.explorerUrl.replace(/\/$/, '')
      await Linking.openURL(`${explorerUrl}/tx/${callTxnId}`)
    },
    [state?.network?.explorerUrl]
  )

  const summary = useMemo(() => {
    const calls = state?.stepsState?.calls
    if (!calls || !state.network?.chainId) return []

    return calls.map((call, i) => {
      const callTxnId = call.txnId || rawCalls?.[i]?.txnId
      const shouldShowCallExplorerIcon =
        identifiedByType === 'MultipleTxns' && !!callTxnId && !!state.network?.explorerUrl

      return (
        <TransactionSummary
          key={
            call.id ||
            call.txnId ||
            `${call.to || 'deploy'}-${call.value.toString()}-${call.data}-${i}`
          }
          style={i !== calls.length! - 1 ? (spacings.mbSm as ViewStyle) : {}}
          call={call}
          chainId={state.network!.chainId}
          rightIcon={shouldShowCallExplorerIcon ? <OpenIcon width={size} height={size} /> : null}
          onRightIconPress={
            shouldShowCallExplorerIcon ? () => handleOpenCallExplorer(callTxnId) : undefined
          }
          size={sizeStr}
          type="benzin"
          hasCallFailed={call.status === AccountOpStatus.Rejected}
          disableSelectorFetching
        />
      )
    })
    // Prevents unnecessary re-renders of the humanizer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    handleOpenCallExplorer,
    identifiedByType,
    rawCalls,
    state?.network?.chainId,
    state?.network?.explorerUrl,
    state?.stepsState?.calls
  ])

  const backgroundSource = useMemo(() => {
    if (maxWidthSize(1920)) return gradient2560
    if (maxWidthSize(1560)) return gradient1920
    if (maxWidthSize(780) || isExtension) return gradient1560

    return gradient780
  }, [maxWidthSize])

  if ((state && !state?.isInitialized) || !isStoreReady)
    return (
      <View style={[spacings.pv, spacings.ph, flexbox.center, flexbox.flex1]}>
        <Spinner />
      </View>
    )

  if (!state || !state.network) {
    if (state?.isNetworkNotFound) {
      return (
        <View style={[spacings.pv, spacings.ph, flexbox.center, flexbox.flex1]}>
          <Text fontSize={24} style={spacings.mbMi} weight="semiBold">
            Network not supported
          </Text>
          <Text fontSize={16}>
            The network with chainId{' '}
            <Text fontSize={16} weight="medium">
              {state.bigintChainId.toString()}
            </Text>{' '}
            is not supported.
          </Text>
        </View>
      )
    }

    return (
      <View style={[spacings.pv, spacings.ph, flexbox.center, flexbox.flex1]}>
        <Text fontSize={24} style={spacings.mbMi} weight="semiBold">
          Error loading transaction
        </Text>
        <Text fontSize={16}>
          Invalid url params. Make sure{' '}
          <Text fontSize={16} weight="medium">
            chainId and txnId/userOpHash
          </Text>{' '}
          are provided.
        </Text>
      </View>
    )
  }

  const {
    activeStep,
    network,
    txnId,
    userOpHash,
    stepsState,
    handleCopyText,
    handleOpenExplorer,
    showCopyBtn,
    showOpenExplorerBtn
  } = state

  const finalizedStatus = stepsState.finalizedStatus
  const hasBalanceChangesLoaded =
    typeof stepsState.submittedAccountOp?.balanceChanges !== 'undefined' ||
    typeof stepsState.balanceChanges !== 'undefined'
  const displayActiveStep =
    activeStep === 'finalized' && shouldShowTxnProgress(finalizedStatus) && !hasBalanceChangesLoaded
      ? 'balance-changes'
      : activeStep
  // Keep the celebration overlay on the whole Benzin view (outside the scroll content) so it can
  // fill the screen without creating a phantom scrollbar
  const showConfetti =
    displayActiveStep === 'finalized' &&
    finalizedStatus !== null &&
    finalizedStatus.status === 'confirmed'

  return (
    <View style={flexbox.flex1} onLayout={handleViewLayout}>
      <View
        pointerEvents="none"
        style={
          isWeb
            ? { ...StyleSheet.absoluteFillObject, zIndex: -1 }
            : {
                position: 'absolute',
                top: -insets.top - SPACING_SM,
                left: 0,
                height: DEVICE_HEIGHT,
                width: DEVICE_WIDTH
              }
        }
      >
        <Image
          style={isWeb ? styles.backgroundImage : { flex: 1, objectFit: 'fill' }}
          source={
            typeof backgroundSource === 'number' ? backgroundSource : { uri: backgroundSource }
          }
          resizeMode="cover"
        />
      </View>
      {!!showConfetti && viewSize.width > 0 && viewSize.height > 0 && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { zIndex: 2, overflow: 'hidden' }]}
        >
          <ConfettiAnimation
            type="tertiary"
            width={viewSize.width}
            height={viewSize.height}
            // Only the side panel needs a full-bleed stretch; popup/mobile keep the original
            // centered containment so the celebration looks the same there
            resizeMode={isSidePanel ? 'stretch' : 'contain'}
            autoPlay
            loop={false}
          />
        </View>
      )}
      <ScrollView
        style={flexbox.flex1}
        scrollEnabled={!isSidePanel || isSidePanelScrollEnabled}
        onLayout={isSidePanel ? handleScrollViewLayout : undefined}
        onContentSizeChange={isSidePanel ? handleScrollContentSizeChange : undefined}
        contentContainerStyle={[
          styles.container,
          // Less top padding in the side panel so short progress views stay within the scroll area
          // above the pinned footer
          isSidePanel && { ...spacings.ptSm, ...spacings.pbSm }
        ]}
      >
        <View style={styles.content}>
          <Header activeStep={activeStep} network={network} topContent={topContent} />
          <Steps
            activeStep={activeStep}
            txnId={txnId}
            userOpHash={userOpHash}
            stepsState={stepsState}
            summary={summary}
            delegation={state?.stepsState?.delegation}
          />
          {!children ? (
            <Buttons
              handleCopyText={handleCopyText}
              handleOpenExplorer={handleOpenExplorer}
              disableOpenExplorerBtn={disableOpenExplorerBtn}
              showCopyBtn={showCopyBtn}
              showOpenExplorerBtn={showOpenExplorerBtn}
            />
          ) : (
            needsFooterSpacer && (
              // Leave enough space for the absolutely positioned buttons
              <View style={{ marginBottom: 80 }} />
            )
          )}
        </View>
      </ScrollView>
      {children}
    </View>
  )
}

export default memo(Benzin)

import React, { Suspense, useMemo } from 'react'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import SkeletonLoader from '@common/components/SkeletonLoader'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { SPACING_TY } from '@common/styles/spacings'

import Footer from './Footer'
import { getPresentationalStatus } from './helpers'
// Lazy on web/extension, static on mobile - see `lazySummaryDetails.native.ts`. The sheet
// shell itself stays eager so its Modalize ref is mounted and openable on tap.
import SummaryDetails from './lazySummaryDetails'
import getStyles from './styles'
import { Props, SubmittedAccountOpLike } from './types'

import type { Modalize } from 'react-native-modalize'

// Hoisted so the reference stays stable across re-renders, otherwise it defeats the
// `React.memo` on `BottomSheet` (see the note in `Select/components/BottomSheetContainer`)
const SHEET_STYLE = {
  maxWidth: 720,
  paddingVertical: 0,
  paddingHorizontal: 0,
  overflow: 'hidden'
} as const

// The web BottomSheet reserves room for the scrollbar by padding the content on the right only,
// which leaves it off-center. Mirroring that padding on the left evens the two sides out. Native
// reserves nothing, so it keeps the plain `phSm` its content already sets.
const SCROLL_WRAPPER_STYLE = isWeb ? { paddingLeft: SPACING_TY } : undefined

type SummaryDetailsSheetProps = {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  modalType: Props['modalType']
  submittedAccountOp: SubmittedAccountOpLike
  network: Network
  size: NonNullable<Props['size']>
  defaultType: Props['defaultType']
}

const SummaryDetailsSheet = ({
  sheetRef,
  closeBottomSheet,
  modalType,
  submittedAccountOp,
  network,
  size,
  defaultType
}: SummaryDetailsSheetProps) => {
  const { styles } = useTheme(getStyles)
  const { t } = useTranslation()

  const headerComponent = useMemo(
    () => (
      <View style={styles.sheetHeader}>
        <ModalHeader title={t('Activity information')} handleClose={closeBottomSheet} />
      </View>
    ),
    [styles.sheetHeader, t, closeBottomSheet]
  )

  const footerComponent = useMemo(
    () => (
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
    ),
    [size, network, submittedAccountOp]
  )

  const scrollViewProps = useMemo(
    () => ({ contentContainerStyle: styles.sheetScrollContent }),
    [styles.sheetScrollContent]
  )

  return (
    <BottomSheet
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      type={modalType}
      // Modalize has to own the scroll view here. It tracks the scroll offset of its own
      // scrollable and only lets a downward drag close the sheet while that offset is 0, so
      // scrolling the content no longer fights the sheet. A `customRenderer` cannot do this:
      // Modalize clones the element it is handed and injects `onScroll` into it, so a wrapping
      // `View` silently swallows the wiring and every drag past the threshold closes the sheet.
      adjustToContentHeight={false}
      HeaderComponent={headerComponent}
      FooterComponent={footerComponent}
      scrollViewProps={scrollViewProps}
      containerInnerWrapperStyles={SCROLL_WRAPPER_STYLE}
      // Keeps the reserved scrollbar gutter on web constant, so the mirrored left padding
      // above stays matched whether or not the content happens to overflow
      reserveScrollPadding
      style={SHEET_STYLE}
    >
      <Suspense fallback={<SkeletonLoader width="100%" height={240} />}>
        <SummaryDetails
          submittedAccountOp={submittedAccountOp}
          network={network}
          size={size}
          defaultType={defaultType}
        />
      </Suspense>
    </BottomSheet>
  )
}

export default React.memo(SummaryDetailsSheet)

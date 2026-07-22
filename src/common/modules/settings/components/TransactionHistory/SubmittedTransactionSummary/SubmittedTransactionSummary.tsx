import React, { lazy, Suspense, useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Network } from '@ambire-common/interfaces/network'
import SkeletonLoader from '@common/components/SkeletonLoader'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useMultiHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import { sizeMultiplier } from '@common/modules/sign-account-op/components/TransactionSummary/sizeMultiplier'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { getUiType } from '@common/utils/uiType'

import getStyles from './styles'
import SummaryDetailsSheet from './SummaryDetailsSheet'
import SummaryHeader from './SummaryHeader'
import { Props } from './types'

// Single import closure reused for both the lazy component and the preloader, so warming
// the chunk (see preloadSummaryPreview) hits the exact same webpack chunk instead of
// producing a duplicate.
const importSummaryPreview = () => import('./SummaryPreview')
const SummaryPreview = lazy(importSummaryPreview)

// Kicks off the humanizer-carrying chunk before the rows mount (e.g. while the activity
// list is still fetching its data), so the full-row skeleton below is skipped in the
// common case.
export const preloadSummaryPreview = importSummaryPreview

// Matches ActivityPositionsSkeleton's row height so the loading state is visually seamless
// and the whole row swaps to its final content in one step (no intra-row layout shift).
const ROW_SKELETON_HEIGHT = 96

const { isTab } = getUiType()

const SubmittedTransactionSummaryInner = ({
  submittedAccountOp,
  size = 'lg',
  style,
  defaultType,
  modalType
}: Props) => {
  const { styles, theme } = useTheme(getStyles)
  const { networks } = useController('NetworksController').state
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  const network: Network | undefined = useMemo(
    () => networks.find((n) => n.chainId === submittedAccountOp.chainId),
    [networks, submittedAccountOp.chainId]
  )

  const handleOpenDetails = () => {
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
      <Suspense
        fallback={<SkeletonLoader width="100%" height={ROW_SKELETON_HEIGHT} style={style} />}
      >
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
          <SummaryHeader submittedAccountOp={submittedAccountOp} network={network} size={size} />
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
          <SummaryPreview submittedAccountOp={submittedAccountOp} />
        </AnimatedPressable>
      </Suspense>
      <SummaryDetailsSheet
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        modalType={isTab ? 'modal' : modalType}
        submittedAccountOp={submittedAccountOp}
        network={network}
        size={size}
        defaultType={defaultType}
      />
    </>
  )
}

const SubmittedTransactionSummary = ({
  submittedAccountOp,
  size = 'lg',
  style,
  defaultType,
  modalType = 'bottom-sheet'
}: Props) => {
  return (
    <SubmittedTransactionSummaryInner
      key={submittedAccountOp.id || submittedAccountOp.txnId}
      submittedAccountOp={submittedAccountOp}
      size={size}
      style={style}
      defaultType={defaultType}
      modalType={modalType}
    />
  )
}

export default React.memo(SubmittedTransactionSummary)

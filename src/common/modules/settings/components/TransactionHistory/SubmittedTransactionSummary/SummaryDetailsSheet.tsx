import React, { lazy, Suspense } from 'react'
import { Pressable, ScrollView, View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import BottomSheet from '@common/components/BottomSheet'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'

import Footer from './Footer'
import { getPresentationalStatus } from './helpers'
import getStyles from './styles'
import { Props, SubmittedAccountOpLike } from './types'

import type { Modalize } from 'react-native-modalize'

// Lazy so the humanizer (pulled in via SummaryDetails) stays out of the main bundle.
// The sheet shell itself stays eager so its Modalize ref is mounted and openable on tap.
const SummaryDetails = lazy(() => import('./SummaryDetails'))

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
  const { styles, theme } = useTheme(getStyles)
  const { t } = useTranslation()

  return (
    <BottomSheet
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      type={modalType}
      adjustToContentHeight={modalType === 'modal'}
      containerInnerWrapperStyles={styles.sheetContainer}
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
            <Text weight="semiBold" style={styles.sheetHeaderTitle}>
              {t('Activity information')}
            </Text>
            <View style={styles.sheetHeaderBackButton} />
          </View>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
          >
            <Suspense fallback={<SkeletonLoader width="100%" height={240} />}>
              <SummaryDetails
                submittedAccountOp={submittedAccountOp}
                network={network}
                size={size}
                defaultType={defaultType}
              />
            </Suspense>
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
  )
}

export default React.memo(SummaryDetailsSheet)

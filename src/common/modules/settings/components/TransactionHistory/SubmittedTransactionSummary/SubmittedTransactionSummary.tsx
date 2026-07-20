import React, { useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Network } from '@ambire-common/interfaces/network'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useMultiHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import { sizeMultiplier } from '@common/modules/sign-account-op/components/TransactionSummary'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { getUiType } from '@common/utils/uiType'

import {
  getDappInteractions,
  getSummaryBalanceChanges,
  getVisibleSummaryBalanceChanges,
  MAX_VISIBLE_BALANCE_CHANGES
} from './helpers'
import getStyles from './styles'
import SummaryDetailsSheet from './SummaryDetailsSheet'
import SummaryHeader from './SummaryHeader'
import SummaryPreview from './SummaryPreview'
import { Props } from './types'

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
        <SummaryPreview
          submittedAccountOp={submittedAccountOp}
          dappInteractions={dappInteractions}
          visibleBalanceChanges={visibleBalanceChanges}
          hiddenBalanceChangesCount={hiddenBalanceChangesCount}
          shouldShowBalanceChangesSummary={shouldShowBalanceChangesSummary}
        />
      </AnimatedPressable>
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

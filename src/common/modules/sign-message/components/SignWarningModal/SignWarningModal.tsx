import React, { FC, RefObject } from 'react'

import BottomSheet from '@common/components/BottomSheet'
import type { SheetRef } from '@common/components/BottomSheet/useSheetRef'
import DualChoiceWarningModal from '@common/components/DualChoiceWarningModal'
import { useTranslation } from '@common/config/localization'
import { getUiType } from '@common/utils/uiType'

import type { HumanizerWarning } from '@ambire-common/libs/humanizer/interfaces'
const { isTab, isRequestWindow } = getUiType()

type Props = {
  sheetRef: RefObject<SheetRef | null>
  warning: HumanizerWarning
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Asks the user to confirm a warning of the message before signing it (see
 * `HumanizerWarning.promptBefore`). Looks the same as the confirmation on the sign transaction
 * screen
 */
const SignWarningModal: FC<Props> = ({ sheetRef, warning, onConfirm, onCancel }) => {
  const { t } = useTranslation()

  return (
    <BottomSheet
      id="sign-message-warning-modal"
      closeBottomSheet={onCancel}
      sheetRef={sheetRef}
      type={isTab || isRequestWindow ? 'modal' : 'bottom-sheet'}
      withBackdropBlur={false}
      shouldBeClosableOnDrag={false}
    >
      <DualChoiceWarningModal
        title={t(warning.title || 'Warning')}
        description={t(warning.content)}
        primaryButtonText={t('Proceed')}
        secondaryButtonText={t('Cancel')}
        onPrimaryButtonPress={onConfirm}
        onSecondaryButtonPress={onCancel}
      />
    </BottomSheet>
  )
}

export default React.memo(SignWarningModal)

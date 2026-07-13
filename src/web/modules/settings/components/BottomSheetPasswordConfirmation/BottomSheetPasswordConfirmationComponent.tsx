import React from 'react'
import { Modalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import spacings from '@common/styles/spacings'
import PasswordConfirmation from '@web/modules/settings/components/PasswordConfirmation'

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  onPasswordConfirmed: (password: string) => void
  text: string
  title?: string
  onCustomSubmit?: (password: string) => void
  id?: string
}

const BottomSheetPasswordConfirmationComponent: React.FC<Props> = ({
  sheetRef,
  closeBottomSheet,
  onPasswordConfirmed,
  text,
  title,
  onCustomSubmit,
  id = 'confirm-password-bottom-sheet'
}) => {
  return (
    <BottomSheet
      sheetRef={sheetRef}
      id={id}
      type="modal"
      closeBottomSheet={closeBottomSheet}
      scrollViewProps={{ contentContainerStyle: { flex: 1 } }}
      containerInnerWrapperStyles={{ flex: 1 }}
      style={{ maxWidth: 432, minHeight: 432, ...spacings.pvLg }}
    >
      <PasswordConfirmation
        text={text}
        title={title}
        onPasswordConfirmed={onPasswordConfirmed}
        onCustomSubmit={onCustomSubmit}
        onBackButtonPress={closeBottomSheet}
      />
    </BottomSheet>
  )
}

export default React.memo(BottomSheetPasswordConfirmationComponent)

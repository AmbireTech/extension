import React from 'react'
import { ViewStyle } from 'react-native'
import { Modalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import spacings from '@common/styles/spacings'
import PasswordConfirmation from '@common/modules/settings/components/PasswordConfirmation'

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  onPasswordConfirmed: (password: string) => void
  text: string
  title?: string
  onCustomSubmit?: (password: string) => void
  id?: string
  /** Rendered between the password field and the submit button */
  children?: React.ReactNode
  submitText?: string
  isSubmitting?: boolean
  /** Merged over the sheet's own sizing, e.g. to match the width of the panel behind it */
  style?: ViewStyle
}

const BottomSheetPasswordConfirmationComponent: React.FC<Props> = ({
  sheetRef,
  closeBottomSheet,
  onPasswordConfirmed,
  text,
  title,
  onCustomSubmit,
  id = 'confirm-password-bottom-sheet',
  children,
  submitText,
  isSubmitting,
  style
}) => {
  return (
    <BottomSheet
      sheetRef={sheetRef}
      id={id}
      type="modal"
      closeBottomSheet={closeBottomSheet}
      scrollViewProps={{ contentContainerStyle: { flex: 1 } }}
      containerInnerWrapperStyles={{ flex: 1 }}
      style={{ maxWidth: 432, minHeight: 432, ...spacings.pvLg, ...style }}
    >
      <PasswordConfirmation
        text={text}
        title={title}
        onPasswordConfirmed={onPasswordConfirmed}
        onCustomSubmit={onCustomSubmit}
        onBackButtonPress={closeBottomSheet}
        submitText={submitText}
        isSubmitting={isSubmitting}
      >
        {children}
      </PasswordConfirmation>
    </BottomSheet>
  )
}

export default React.memo(BottomSheetPasswordConfirmationComponent)

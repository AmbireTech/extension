import type { ViewStyle } from 'react-native'
import type { Modalize } from 'react-native-modalize'

import type { FC, ReactNode, RefObject } from 'react'
import { memo } from 'react'

import BottomSheet from '@common/components/BottomSheet'
import PasswordConfirmation from '@common/modules/settings/components/PasswordConfirmation'
import spacings from '@common/styles/spacings'

interface Props {
  sheetRef: RefObject<Modalize>
  closeBottomSheet: () => void
  onPasswordConfirmed: (password: string) => void
  text: string
  title?: string
  onCustomSubmit?: (password: string) => void
  id?: string
  /** Rendered between the password field and the submit button */
  children?: ReactNode
  submitText?: string
  isSubmitting?: boolean
  /** Merged over the sheet's own sizing, e.g. to match the width of the panel behind it */
  style?: ViewStyle
}

const BottomSheetPasswordConfirmationComponent: FC<Props> = ({
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

export default memo(BottomSheetPasswordConfirmationComponent)

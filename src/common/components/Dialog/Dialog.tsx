import React, { FC } from 'react'

import BottomSheet from '@common/components/BottomSheet'
import { BOTTOM_SHEET_Z_INDEX } from '@common/components/BottomSheet/styles'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import spacings from '@common/styles/spacings'

interface Props {
  id: string
  dialogRef: any
  title: string
  text: string
  closeDialog: () => void
  children: React.ReactNode | React.ReactNode[]
}

const Dialog: FC<Props> = ({ id, dialogRef, closeDialog, title, text, children }) => {
  return (
    <BottomSheet
      id={id}
      sheetRef={dialogRef}
      closeBottomSheet={closeDialog}
      type={isMobile ? 'bottom-sheet' : 'modal'}
      style={
        isWeb
          ? {
              overflow: 'hidden',
              width: 512
            }
          : {}
      }
      customZIndex={BOTTOM_SHEET_Z_INDEX + 1}
    >
      <Text fontSize={18} weight="semiBold" style={spacings.mbMi}>
        {title}
      </Text>
      <Text fontSize={14} style={isMobile ? spacings.mbLg : spacings.mb}>
        {text}
      </Text>
      {children}
    </BottomSheet>
  )
}

export default Dialog

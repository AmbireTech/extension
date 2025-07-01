import React, { FC } from 'react'

import BottomSheet from '@common/components/BottomSheet'
import { BOTTOM_SHEET_Z_INDEX } from '@common/components/BottomSheet/styles'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'

interface Props {
  id: string
  dialogRef: any
  title: string
  text: string
  closeDialog: () => void
  children: React.ReactNode | React.ReactNode[]
}

const Dialog: FC<Props> = ({ id, dialogRef, closeDialog, title, text, children }) => {
  const { themeType } = useTheme()
  return (
    <BottomSheet
      id={id}
      sheetRef={dialogRef}
      closeBottomSheet={closeDialog}
      type="modal"
      style={{
        overflow: 'hidden',
        width: 512
      }}
      customZIndex={BOTTOM_SHEET_Z_INDEX + 1}
      backgroundColor={themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'}
    >
      <Text fontSize={18} weight="semiBold" style={spacings.mbMi}>
        {title}
      </Text>
      <Text fontSize={14} style={spacings.mb}>
        {text}
      </Text>
      {children}
    </BottomSheet>
  )
}

export default Dialog

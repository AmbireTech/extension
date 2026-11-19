import React, { FC } from 'react'

import BottomSheet from '@common/components/BottomSheet'
import SheetHeaderRow from '@common/components/BottomSheet/SheetHeaderRow'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import spacings from '@common/styles/spacings'
import textStyles from '@common/styles/utils/text'

interface Props {
  id: string
  dialogRef: any
  title: string
  text: string
  closeDialog: () => void
  children: React.ReactNode | React.ReactNode[]
}

const Dialog: FC<Props> = ({ id, dialogRef, closeDialog, title, text, children }) => {
  const { isNarrowWebLayout } = useCompactLayout()
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
              ...(isNarrowWebLayout ? {} : { width: 512 })
            }
          : {}
      }
    >
      <SheetHeaderRow style={spacings.mbMi}>
        <Text fontSize={18} weight="semiBold" style={textStyles.center}>
          {title}
        </Text>
      </SheetHeaderRow>
      <Text fontSize={14} style={isMobile ? spacings.mbLg : spacings.mb}>
        {text}
      </Text>
      {children}
    </BottomSheet>
  )
}

export default Dialog

import { DerivationOption } from '@ambire-common/consts/derivation'
import type { SheetRef } from '@common/components/BottomSheet/useSheetRef'
import { SelectValue } from '@common/components/Select/types'

export type FormData = {
  startIndex: string
  selectedOption: SelectValue
}

export type Props = {
  sheetRef: React.RefObject<SheetRef | null>
  closeBottomSheet: () => void
  onConfirm: (hdPath: SelectValue, startIndex: number) => void
  disabled?: boolean
  page?: number
  options: DerivationOption[]
  value: SelectValue
}

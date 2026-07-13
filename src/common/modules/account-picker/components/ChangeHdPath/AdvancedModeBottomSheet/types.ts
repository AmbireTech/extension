import { Modalize } from 'react-native-modalize'

import { DerivationOption } from '@ambire-common/consts/derivation'
import { SelectValue } from '@common/components/Select/types'

export type FormData = {
  startIndex: string
  selectedOption: SelectValue
}

export type Props = {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  onConfirm: (hdPath: SelectValue, startIndex: number) => void
  disabled?: boolean
  page?: number
  options: DerivationOption[]
  value: SelectValue
}

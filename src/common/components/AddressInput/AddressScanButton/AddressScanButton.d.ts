import { FC } from 'react'

export interface AddressScanButtonProps {
  onScanned: (address: string) => void
}

declare const AddressScanButton: FC<AddressScanButtonProps>

export default AddressScanButton

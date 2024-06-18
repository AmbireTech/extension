import { getAddress } from 'ethers'

import { AddressState } from '@ambire-common/interfaces/domains'

const getAddressFromAddressState = (addressState: AddressState) => {
  return getAddress(
    (addressState.udAddress || addressState.ensAddress || addressState.fieldValue || '').trim()
  )
}

export { getAddressFromAddressState }

import { HD_PATH_TEMPLATE_TYPE } from '@ambire-common/consts/derivation'
import { KeyIterator as KeyIteratorInterface } from '@ambire-common/interfaces/keyIterator'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import LedgerController from '@web/modules/hardware-wallet/controllers/LedgerController'

interface KeyIteratorProps {
  controller: LedgerController
}

const MISSING_CONTROLLER_MSG =
  'Unable to interact with the hardware wallet. During the preparation step, required hardware wallet connection modules failed to get initialized. Please try again or contact Ambire support.'
const INVALID_PARAMS_MSG =
  'Unable to retrieve keys because of invalid parameters received. Please try again or contact Ambire support.'

/**
 * Serves for retrieving a range of addresses/keys from a Ledger hardware wallet
 */
class LedgerKeyIterator implements KeyIteratorInterface {
  type = 'ledger' as const

  subType = 'hw' as const

  controller: LedgerController

  constructor({ controller }: KeyIteratorProps) {
    if (!controller) throw new Error(MISSING_CONTROLLER_MSG)

    this.controller = controller
  }

  async retrieve(
    fromToArr: { from: number; to: number }[],
    hdPathTemplate?: HD_PATH_TEMPLATE_TYPE
  ) {
    if (!this.controller) throw new Error(MISSING_CONTROLLER_MSG)

    const pathsOfAddressesToRetrieve: string[] = []
    // eslint-disable-next-line no-restricted-syntax
    for (const { from, to } of fromToArr) {
      if ((!from && from !== 0) || (!to && to !== 0) || !hdPathTemplate)
        throw new Error(INVALID_PARAMS_MSG)

      for (let i = from; i <= to; i++)
        pathsOfAddressesToRetrieve.push(getHdPathFromTemplate(hdPathTemplate, i))
    }

    const keys = await this.controller.retrieveAddresses(pathsOfAddressesToRetrieve)
    return keys
  }
}

export default LedgerKeyIterator

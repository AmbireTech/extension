import { getAddress } from 'ethers'

import {
  BIP44_STANDARD_DERIVATION_TEMPLATE,
  HD_PATH_TEMPLATE_TYPE
} from '@ambire-common/consts/derivation'
import { KeyIterator as KeyIteratorInterface } from '@ambire-common/interfaces/keyIterator'
import { ExternalSignerController } from '@ambire-common/interfaces/keystore'
import { getHDPathIndices } from '@ambire-common/utils/hdPath'

// eslint-disable-next-line @typescript-eslint/naming-convention
type KeyIteratorProps = {
  controller: ExternalSignerController
}

/**
 * Serves for retrieving a range of addresses/keys from a Lattice hardware wallet
 */
class LatticeKeyIterator implements KeyIteratorInterface {
  type = 'lattice' as 'lattice'

  subType = 'hw' as 'hw'

  controller: ExternalSignerController

  constructor({ controller }: KeyIteratorProps) {
    if (!controller) throw new Error('latticeKeyIterator: missing controller prop')

    this.controller = controller
  }

  /**
   * Determine if an HD path has a variable index internal to it.
   * e.g. m/44'/60'/<account>'/0/0 -> true, while m/44'/60'/0'/0/<account> -> false
   * This is just a hacky helper to avoid having to recursively call for non-ledger
   * derivation paths. Ledger is SO ANNOYING TO SUPPORT.
   */
  #hdPathHasInternalVarIdx(hdPathTemplate: HD_PATH_TEMPLATE_TYPE) {
    const path = hdPathTemplate.split('/').slice(1)
    for (let i = 0; i < path.length - 1; i++) {
      if (path[i].indexOf('<account>') > -1) return true
    }
    return false
  }

  // Helper to fetch addresses recursively, one by one
  async #fetchAddressesRecursively(
    n: number,
    i: number,
    recursedAddresses: string[],
    hdPathTemplate: HD_PATH_TEMPLATE_TYPE
  ): Promise<string[]> {
    if (n === 0) return recursedAddresses

    const startPath = getHDPathIndices(hdPathTemplate, i)
    const keyData = { startPath, n: 1 /* Always fetch one address at a time when recursing */ }
    const addresses = await this.controller.walletSDK.getAddresses(keyData)

    if (addresses.length < 1) throw new Error('latticeKeyIterator: no addresses returned')

    // Continue the recursion if needed
    return this.#fetchAddressesRecursively(
      n - 1,
      i + 1,
      // @ts-ignore TODO: figure out the corner cases when the SDK returns Buffer[]
      recursedAddresses.concat(addresses),
      hdPathTemplate
    )
  }

  async retrieve(
    fromToArr: { from: number; to: number }[],
    hdPathTemplate?: HD_PATH_TEMPLATE_TYPE
  ) {
    if (!this.controller.walletSDK && this.controller.unlock) {
      await this.controller.unlock(hdPathTemplate || BIP44_STANDARD_DERIVATION_TEMPLATE)
    }

    if (!this.controller.walletSDK) throw new Error('latticeKeyIterator: walletSDK not initialized')

    const keys: string[] = []

    // eslint-disable-next-line no-restricted-syntax
    for (const { from, to } of fromToArr) {
      if ((!from && from !== 0) || (!to && to !== 0) || !hdPathTemplate)
        throw new Error('latticeKeyIterator: invalid or missing arguments')

      const n = to - from + 1

      const shouldFetchRecursively = this.#hdPathHasInternalVarIdx(hdPathTemplate)
      if (shouldFetchRecursively) {
        // eslint-disable-next-line no-await-in-loop
        const res = await this.#fetchAddressesRecursively(n, from, [], hdPathTemplate)
        keys.push(...res.map((addr) => getAddress(addr)))
      } else {
        // Normal fetching without recursion
        const startPath = getHDPathIndices(hdPathTemplate, from)
        const keyData = { startPath, n }

        // @ts-ignore TODO: figure out the corner cases when this returns Buffer[]
        // eslint-disable-next-line no-await-in-loop
        let res: string[] = await this.controller.walletSDK.getAddresses(keyData)
        // For some reason, the addresses incoming from the device are not
        // checksumed, that's why manually checksum them here.
        res = res?.map((addr) => getAddress(addr)) || []
        keys.push(...res)
      }
    }

    return keys
  }
}

export default LatticeKeyIterator

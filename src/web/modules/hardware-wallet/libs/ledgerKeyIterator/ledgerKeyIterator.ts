import { HD_PATH_TEMPLATE_TYPE } from '@ambire-common/consts/derivation'
import { KeyIterator as KeyIteratorInterface } from '@ambire-common/interfaces/keyIterator'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import { Eth } from '@web/modules/hardware-wallet/controllers/LedgerController'

interface KeyIteratorProps {
  walletSDK: Eth
}

/**
 * Serves for retrieving a range of addresses/keys from a Ledger hardware wallet
 */
class LedgerKeyIterator implements KeyIteratorInterface {
  walletSDK: KeyIteratorProps['walletSDK']

  constructor({ walletSDK }: KeyIteratorProps) {
    if (!walletSDK) throw new Error('ledgerKeyIterator: missing walletSDK prop')

    this.walletSDK = walletSDK
  }

  async retrieve(from: number, to: number, hdPathTemplate?: HD_PATH_TEMPLATE_TYPE) {
    if (!this.walletSDK) throw new Error('trezorKeyIterator: walletSDK not initialized')

    if ((!from && from !== 0) || (!to && to !== 0) || !hdPathTemplate)
      throw new Error('ledgerKeyIterator: invalid or missing arguments')

    const keys: string[] = []

    for (let i = from; i <= to; i++) {
      // eslint-disable-next-line no-await-in-loop
      const key = await this.walletSDK.getAddress(
        getHdPathFromTemplate(hdPathTemplate, i),
        false,
        true
      )

      !!key && keys.push(key.address)
    }

    return keys
  }
}

export default LedgerKeyIterator

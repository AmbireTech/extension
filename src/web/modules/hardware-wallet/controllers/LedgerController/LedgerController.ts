import HDKey from 'hdkey'

import LedgerEth from '@ledgerhq/hw-app-eth'
import Transport from '@ledgerhq/hw-transport'
import TransportWebHID from '@ledgerhq/hw-transport-webhid'
import { LEDGER_LIVE_HD_PATH } from '@web/modules/hardware-wallet/constants/hdPaths'
import LedgerKeyIterator from '@web/modules/hardware-wallet/libs/ledgerKeyIterator'

class LedgerController {
  hdk: any

  hasHIDPermission: boolean | null

  accounts: any

  hdPath: string = LEDGER_LIVE_HD_PATH

  isWebHID: boolean

  transport: Transport | null

  app: null | LedgerEth

  constructor() {
    this.hdk = new HDKey()
    this.hasHIDPermission = null
    // TODO: make it optional (by default should be false and set it to true only when there is ledger connected via usb)
    this.isWebHID = true
    this.transport = null
    this.app = null
  }

  isUnlocked() {
    return Boolean(this.hdk && this.hdk.publicKey)
  }

  setHdPath(hdPath: string) {
    // Reset HDKey if the path changes
    if (this.hdPath !== hdPath) {
      this.hdk = new HDKey()
    }
    this.hdPath = hdPath
  }

  async makeApp() {
    if (!this.app) {
      try {
        // @ts-ignore
        this.transport = await TransportWebHID.create()
        this.app = new LedgerEth(this.transport as Transport)
      } catch (e: any) {
        Promise.reject(new Error('ledgerController: permission rejected'))
      }
    }
  }

  async unlock(hdPath?: string) {
    if (this.isUnlocked() && !hdPath) {
      return 'ledgerController: already unlocked'
    }

    const path = hdPath ? this._toLedgerPath(hdPath) : this.hdPath
    if (this.isWebHID) {
      try {
        await this.makeApp()
        const res = await this.app!.getAddress(path, false, true)
        const { address, publicKey, chainCode } = res
        this.hdk.publicKey = Buffer.from(publicKey, 'hex')
        this.hdk.chainCode = Buffer.from(chainCode!, 'hex')

        return address
      } catch (e: any) {
        throw new Error(e)
      }
    }

    return null
    // TODO: impl when isWebHID is false
  }

  authorizeHIDPermission() {
    this.hasHIDPermission = true
  }

  async getKeys(from: number = 0, to: number = 4) {
    await this.makeApp()

    return new Promise((resolve, reject) => {
      for (let i = from; i <= to; i++) {
        this.unlock(this._getPathForIndex(i))
          .then(async () => {
            const iterator = new LedgerKeyIterator({
              hdk: this.hdk,
              app: this.app
            })
            const keys = await iterator.retrieve(i, i)

            resolve(keys)
          })
          .catch((e) => {
            reject(e)
          })
      }
    })
  }

  async cleanUp() {
    this.app = null
    if (this.transport) this.transport.close()
    this.transport = null
    this.hdk = new HDKey()
  }

  _getPathForIndex(index: number) {
    return this._isLedgerLiveHdPath() ? `m/44'/60'/${index}'/0/0` : `${this.hdPath}/${index}`
  }

  _toLedgerPath(path: string) {
    return path.toString().replace('m/', '')
  }

  _isLedgerLiveHdPath() {
    return this.hdPath === LEDGER_LIVE_HD_PATH
  }
}

export default LedgerController

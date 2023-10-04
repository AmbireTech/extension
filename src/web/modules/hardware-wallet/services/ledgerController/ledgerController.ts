import HDKey from 'hdkey'

import LedgerEth from '@ledgerhq/hw-app-eth'
import Transport from '@ledgerhq/hw-transport'
import TransportWebHID from '@ledgerhq/hw-transport-webhid'

interface Account {
  address: string
  balance: number | null
  index: number
}

class LedgerController {
  page: number

  perPage: number

  hdk: any

  hasHIDPermission: null | boolean

  accounts: any

  hdPath: any

  isWebHID: boolean

  transport: null | Transport

  app: null | LedgerEth

  constructor() {
    this.page = 0
    this.perPage = 5
    this.hdk = new HDKey()
    this.accounts = []
    this.hasHIDPermission = null
    // TODO: make it optional (by default should be false and set it to true only when there is ledger connected via usb)
    this.isWebHID = true
    // TODO: it is temporarily hardcoded
    this.hdPath = "m/44'/60'/0'/0/0"
    this.transport = null
    this.app = null
  }

  isUnlocked() {
    return Boolean(this.hdk && this.hdk.publicKey)
  }

  async makeApp() {
    if (!this.app) {
      try {
        this.transport = await TransportWebHID.create()
        this.app = new LedgerEth(this.transport as Transport)

        return null
      } catch (e: any) {
        return Promise.reject(new Error('Permission Rejected'))
      }
    }
  }

  setHdPath(hdPath: any) {
    // Reset HDKey if the path changes
    if (this.hdPath !== hdPath) {
      this.hdk = new HDKey()
    }
    this.hdPath = hdPath
  }

  async unlock(hdPath?, force?: boolean) {
    if (force) {
      hdPath = this.hdPath
    }
    if (this.isUnlocked() && !hdPath) {
      return 'already unlocked'
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
      } catch (e) {
        throw new Error(e)
      }
    }

    return null
    // TODO: impl when not isWebHID
  }

  authorizeHIDPermission() {
    this.hasHIDPermission = true
  }

  getAccounts() {
    return Promise.resolve(this.accounts.slice())
  }

  async getAddresses(start: number, end: number) {
    const from = start
    const to = end
    await this.unlock()

    const accounts: Account[] = await this._getAccountsBIP44(from, to)

    return accounts
  }

  getFirstPage() {
    this.page = 0
    return this.__getPage(1)
  }

  getNextPage() {
    return this.__getPage(1)
  }

  getPreviousPage() {
    return this.__getPage(-1)
  }

  async cleanUp() {
    this.app = null
    if (this.transport) this.transport.close()
    this.transport = null
    this.hdk = new HDKey()
  }

  async __getPage(increment: number) {
    this.page += increment
    if (this.page <= 0) {
      this.page = 1
    }
    const from = (this.page - 1) * this.perPage
    const to = from + this.perPage

    await this.makeApp()

    const accounts: Account[] = await this._getAccountsBIP44(from, to)

    return accounts
  }

  async _getAccountsBIP44(from: number, to: number) {
    const accounts: Account[] = []

    for (let i = from; i < to; i++) {
      const path = this._getPathForIndex(i)
      // eslint-disable-next-line no-await-in-loop
      const address = (await this.unlock(path)) as string
      // TODO:
      // const valid = this.implementFullBIP44 ? await this._hasPreviousTransactions(address) : true
      accounts.push({
        address,
        balance: null,
        index: i + 1
      })
      // TODO:
      // PER BIP44
      // "Software should prevent a creation of an account if
      // a previous account does not have a transaction history
      // (meaning none of its addresses have been used before)."
      // if (!valid) {
      //   break
      // }
    }

    return accounts
  }

  _getPathForIndex(index: number) {
    // Check if the path is BIP 44 (Ledger Live)
    return this._isLedgerLiveHdPath() ? `m/44'/60'/${index}'/0/0` : `${this.hdPath}/${index}`
  }

  _isLedgerLiveHdPath() {
    return this.hdPath === "m/44'/60'/0'/0/0"
  }

  _toLedgerPath(path: string) {
    return path.toString().replace('m/', '')
  }
}

export default LedgerController

import HDKey from 'hdkey'

import trezorConnect from '@trezor/connect-web'

const ethUtil = require('ethereumjs-util')

const hdPathString = "m/44'/60'/0'/0"
const SLIP0044TestnetPath = "m/44'/1'/0'/0"
const ALLOWED_HD_PATHS: any = {
  [hdPathString]: true,
  [SLIP0044TestnetPath]: true
}
const keyringType = 'Trezor'
const pathBase = 'm'
const MAX_INDEX = 1000

const TREZOR_CONNECT_MANIFEST = {
  email: 'support@debank.com/',
  appUrl: 'https://debank.com/'
}

class TrezorController {
  type: string

  hdk: any

  page: number

  perPage: number

  unlockedAccount: number

  paths: any

  hdPath: string

  model: string

  accounts: any[]

  trezorConnectInitiated: boolean

  accountDetails: any

  constructor() {
    this.type = keyringType
    this.accounts = []
    this.hdk = new HDKey()
    this.page = 0
    this.perPage = 5
    this.unlockedAccount = 0
    this.paths = {}
    this.hdPath = hdPathString
    this.model = ''

    this.trezorConnectInitiated = false
    this.accountDetails = {}
    trezorConnect.on('DEVICE_EVENT', (event: any) => {
      if (event && event.payload && event.payload.features) {
        this.model = event.payload.features.model
      }
    })
  }

  init() {
    if (!this.trezorConnectInitiated) {
      trezorConnect.init({ manifest: TREZOR_CONNECT_MANIFEST, lazyLoad: true })
      this.trezorConnectInitiated = true
    }
  }

  getModel() {
    return this.model
  }

  dispose() {
    // This removes the Trezor Connect iframe from the DOM
    // This method is not well documented, but the code it calls can be seen
    // here: https://github.com/trezor/connect/blob/dec4a56af8a65a6059fb5f63fa3c6690d2c37e00/src/js/iframe/builder.js#L181
    trezorConnect.dispose()
  }

  cleanUp() {
    this.hdk = new HDKey()
  }

  isUnlocked() {
    return Boolean(this.hdk && this.hdk.publicKey)
  }

  unlock() {
    if (this.isUnlocked()) {
      return Promise.resolve('already unlocked')
    }
    return new Promise((resolve, reject) => {
      trezorConnect
        .getPublicKey({
          path: this.hdPath,
          coin: 'ETH'
        })
        .then((response) => {
          if (response.success) {
            this.hdk.publicKey = Buffer.from(response.payload.publicKey, 'hex')
            this.hdk.chainCode = Buffer.from(response.payload.chainCode, 'hex')
            resolve('just unlocked')
          } else {
            reject(new Error((response.payload && response.payload.error) || 'Unknown error'))
          }
        })
        .catch((e) => {
          reject(new Error((e && e.toString()) || 'Unknown error'))
        })
    })
  }

  setAccountToUnlock(index) {
    this.unlockedAccount = parseInt(index, 10)
  }

  addAccounts(n = 1) {
    return new Promise((resolve, reject) => {
      this.unlock()
        .then((_) => {
          const from = this.unlockedAccount
          const to = from + n
          for (let i = from; i < to; i++) {
            const address = this._addressFromIndex(pathBase, i)
            if (!this.accounts.includes(address)) {
              this.accounts.push(address)
            }
            this.page = 0
          }
          resolve(this.accounts)
        })
        .catch((e) => {
          reject(e)
        })
    })
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

  getAddresses(start, end) {
    return new Promise((resolve, reject) => {
      this.unlock()
        .then((_) => {
          const from = start
          const to = end
          const accounts = []
          for (let i = from; i < to; i++) {
            const address = this._addressFromIndex(pathBase, i)
            accounts.push({
              address,
              balance: null,
              index: i + 1
            })
            this.paths[ethUtil.toChecksumAddress(address)] = i
          }
          resolve(accounts)
        })
        .catch((e) => {
          reject(e)
        })
    })
  }

  __getPage(increment) {
    this.page += increment
    if (this.page <= 0) {
      this.page = 1
    }
    return new Promise((resolve, reject) => {
      this.unlock()
        .then((_) => {
          const from = (this.page - 1) * this.perPage
          const to = from + this.perPage
          const accounts = []
          for (let i = from; i < to; i++) {
            const address = this._addressFromIndex(pathBase, i)
            accounts.push({
              address,
              balance: null,
              index: i + 1
            })
            this.paths[ethUtil.toChecksumAddress(address)] = i
          }
          resolve(accounts)
        })
        .catch((e) => {
          reject(e)
        })
    })
  }

  getAccounts() {
    return Promise.resolve(this.accounts.slice())
  }

  removeAccount(address) {
    if (!this.accounts.map((a) => a.toLowerCase()).includes(address.toLowerCase())) {
      throw new Error(`Address ${address} not found in this keyring`)
    }
    this.accounts = this.accounts.filter((a) => a.toLowerCase() !== address.toLowerCase())
    const checksummedAddress = ethUtil.toChecksumAddress(address)
    delete this.accountDetails[checksummedAddress]
    delete this.paths[checksummedAddress]
  }

  signTransaction(address, tx) {
    return this._signTransaction(address, Number(tx.common.chainId()), tx, (payload) => {})
  }

  _signTransaction(address, chainId, tx, handleSigning) {}

  signMessage(withAccount, data) {
    return this.signPersonalMessage(withAccount, data)
  }

  // For personal_sign, we need to prefix the message:
  signPersonalMessage(withAccount, message) {
    // TODO:
  }

  signTypedData(address, data, { version }) {}

  exportAccount() {
    return Promise.reject(new Error('Not supported on this device'))
  }

  forgetDevice() {
    this.accounts = []
    this.hdk = new HDKey()
    this.page = 0
    this.unlockedAccount = 0
    this.paths = {}
  }

  setHdPath(hdPath) {
    if (!ALLOWED_HD_PATHS[hdPath]) {
      throw new Error(`The setHdPath method does not support setting HD Path to ${hdPath}`)
    }
    // Reset HDKey if the path changes
    if (this.hdPath !== hdPath) {
      this.hdk = new HDKey()
      this.accounts = []
      this.page = 0
      this.perPage = 5
      this.unlockedAccount = 0
      this.paths = {}
    }
    this.hdPath = hdPath
  }

  /* PRIVATE METHODS */
  _normalize(buf) {
    return ethUtil.bufferToHex(buf).toString()
  }

  // eslint-disable-next-line no-shadow
  _addressFromIndex(pathBase, i) {
    const dkey = this.hdk.derive(`${pathBase}/${i}`)
    const address = ethUtil.publicToAddress(dkey.publicKey, true).toString('hex')
    return ethUtil.toChecksumAddress(`0x${address}`)
  }

  _pathFromAddress(address) {
    return `${this.hdPath}/${this.indexFromAddress(address)}`
  }

  indexFromAddress(address) {
    const checksummedAddress = ethUtil.toChecksumAddress(address)
    let index = this.paths[checksummedAddress]
    if (typeof index === 'undefined') {
      for (let i = 0; i < MAX_INDEX; i++) {
        if (checksummedAddress === this._addressFromIndex(pathBase, i)) {
          index = i
          break
        }
      }
    }
    if (typeof index === 'undefined') {
      throw new Error('Unknown address')
    }
    return index
  }

  getPathBasePublicKey() {
    return this.hdk.publicKey.toString('hex')
  }
}

export default TrezorController

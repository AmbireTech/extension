import crypto from 'crypto'
import EventEmitter from 'events'
import * as SDK from 'gridplus-sdk'

const keyringType = 'GridPlus'
const HARDENED_OFFSET = 0x80000000
const PER_PAGE = 10
const CLOSE_CODE = -1000
const STANDARD_HD_PATH = "m/44'/60'/0'/0/x"
const SDK_TIMEOUT = 120000
const CONNECT_TIMEOUT = 20000

class LatticeKeyring extends EventEmitter {
  appName: string

  type: string

  hdPath: string

  sdkSession: any

  accountOpts: any

  accounts: any

  creds: any

  unlockedAccount: any

  accountIndices: any

  page: number = 0

  isLocked: boolean = true

  walletUID: any

  network: any

  constructor() {
    super()
    this.appName = 'Ambire Wallet Extension'
    this.type = keyringType
    this.hdPath = STANDARD_HD_PATH
    this._resetDefaults()
  }

  setHdPath() {
    this.hdPath = STANDARD_HD_PATH
  }

  // Deterimine if we have a connection to the Lattice and an existing wallet UID
  // against which to make requests.
  isUnlocked() {
    return !!this._getCurrentWalletUID() && !!this.sdkSession
  }

  // Initialize a session with the Lattice1 device using the GridPlus SDK
  // NOTE: `bypassOnStateData=true` allows us to rehydrate a new SDK session without
  // reconnecting to the target Lattice. This is only currently used for signing
  // because it eliminates the need for 2 connection requests and shaves off ~4-6sec.
  // We avoid passing `bypassOnStateData=true` for other calls on `unlock` to avoid
  // possible edge cases related to this new functionality (it's probably fine - just
  // being cautious). In the future we may remove `bypassOnStateData` entirely.
  async unlock(bypassOnStateData = false) {
    // Force compatability. `this.accountOpts` were added after other
    // state params and must be synced in order for this keyring to function.
    if (
      !this.accountOpts ||
      (this.accounts.length > 0 && this.accountOpts.length != this.accounts.length)
    ) {
      this.forgetDevice()
      throw new Error(
        'You can now add multiple Lattice and SafeCard accounts at the same time! ' +
          'Your accounts have been cleared. Please press Continue to add them back in.'
      )
    }
    if (this.isUnlocked()) {
      return 'Unlocked'
    }
    const creds: any = await this._getCreds()
    if (creds) {
      this.creds.deviceID = creds.deviceID
      this.creds.password = creds.password
      this.creds.endpoint = creds.endpoint || null
    }
    const includedStateData = await this._initSession()
    // If state data was provided and if we are authorized to
    // bypass reconnecting, we can exit here.
    if (includedStateData && bypassOnStateData) {
      return 'Unlocked'
    }
    await this._connect()
    return 'Unlocked'
  }

  // Add addresses to the local store and return the full result
  async addAccounts(n = 1) {
    if (n === CLOSE_CODE) {
      // Special case: use a code to forget the device.
      // (This function is overloaded due to constraints upstream)
      this.forgetDevice()
      return []
    }
    if (n <= 0) {
      // Avoid non-positive numbers.
      throw new Error('Number of accounts to add must be a positive number.')
    }
    // Normal behavior: establish the connection and fetch addresses.
    await this.unlock()
    const addrs = await this._fetchAddresses(n, this.unlockedAccount)
    const walletUID = this._getCurrentWalletUID()
    if (!walletUID) {
      // We should not add accounts that do not have wallet UIDs.
      // Something went wrong and needs to be retried.
      await this._connect()
      throw new Error('No active wallet found in Lattice. Please retry.')
    }
    // Add these indices
    addrs.forEach((addr, i) => {
      let alreadySaved = false
      for (let j = 0; j < this.accounts.length; j++) {
        if (
          this.accounts[j] === addr &&
          this.accountOpts[j].walletUID === walletUID &&
          this.accountOpts[j].hdPath === this.hdPath
        )
          alreadySaved = true
      }
      if (!alreadySaved) {
        this.accounts.push(addr)
        this.accountIndices.push(this.unlockedAccount + i)
        this.accountOpts.push({
          walletUID,
          hdPath: this.hdPath
        })
      }
    })
    return this.accounts
  }

  // Return the local store of addresses. This gets called when the extension unlocks.
  async getAccounts() {
    return this.accounts ? [...this.accounts] : []
  }

  async signTransaction(address, tx) {}

  async signPersonalMessage(address, msg) {
    return this.signMessage(address, { payload: msg, protocol: 'signPersonal' })
  }

  async signTypedData(address, msg, opts) {
    if (opts.version && opts.version !== 'V4' && opts.version !== 'V3') {
      throw new Error(
        `Only signTypedData V3 and V4 messages (EIP712) are supported. Got version ${opts.version}`
      )
    }
    return this.signMessage(address, { payload: msg, protocol: 'eip712' })
  }

  async signMessage(address, msg) {}

  async exportAccount(address) {
    throw new Error('exportAccount not supported by this device')
  }

  removeAccount(address) {
    this.accounts.forEach((account, i) => {
      if (account.toLowerCase() === address.toLowerCase()) {
        this.accounts.splice(i, 1)
        this.accountIndices.splice(i, 1)
        this.accountOpts.splice(i, 1)
      }
    })
  }

  async getFirstPage() {
    this.page = 0
    return this._getPage(0)
  }

  async getNextPage() {
    return this._getPage(1)
  }

  async getPreviousPage() {
    return this._getPage(-1)
  }

  setAccountToUnlock(index) {
    this.unlockedAccount = parseInt(index, 10)
  }

  forgetDevice() {
    this._resetDefaults()
  }

  //-------------------------------------------------------------------
  // Internal methods and interface to SDK
  //-------------------------------------------------------------------

  async _accountIdxInCurrentWallet(address) {
    // Get the wallet UID associated with the signer and make sure
    // the Lattice has that as its active wallet before continuing.
    const accountIdx = await this._findAccountByAddress(address)
    const { walletUID } = this.accountOpts[accountIdx]
    // Get the last updated SDK wallet UID
    const activeWallet = this.sdkSession.getActiveWallet()
    if (!activeWallet) {
      this._connect()
      throw new Error('No active wallet in Lattice.')
    }
    const activeUID = activeWallet.uid.toString('hex')
    // If this is already the active wallet we don't need to make a request
    if (walletUID.toString('hex') === activeUID) {
      return accountIdx
    }
    return null
  }

  async _findAccountByAddress(address) {
    const addrs = await this.getAccounts()
    let accountIdx = -1
    addrs.forEach((addr, i) => {
      if (address.toLowerCase() === addr.toLowerCase()) accountIdx = i
    })
    if (accountIdx < 0) {
      throw new Error('Signer not present')
    }
    return accountIdx
  }

  _getHDPathIndices(hdPath, insertIdx = 0) {
    const path = hdPath.split('/').slice(1)
    const indices = []
    let usedX = false
    path.forEach((_idx) => {
      const isHardened = _idx[_idx.length - 1] === "'"
      let idx = isHardened ? HARDENED_OFFSET : 0
      // If there is an `x` in the path string, we will use it to insert our
      // index. This is useful for e.g. Ledger Live path. Most paths have the
      // changing index as the last one, so having an `x` in the path isn't
      // usually necessary.
      if (_idx.indexOf('x') > -1) {
        idx += insertIdx
        usedX = true
      } else if (isHardened) {
        idx += Number(_idx.slice(0, _idx.length - 1))
      } else {
        idx += Number(_idx)
      }
      indices.push(idx)
    })
    // If this path string does not include an `x`, we just append the index
    // to the end of the extracted set
    if (usedX === false) {
      indices.push(insertIdx)
    }
    // Sanity check -- Lattice firmware will throw an error for large paths
    if (indices.length > 5) throw new Error('Only HD paths with up to 5 indices are allowed.')
    return indices
  }

  _resetDefaults() {
    this.accounts = []
    this.accountIndices = []
    this.accountOpts = []
    this.isLocked = true
    this.creds = {
      deviceID: null,
      password: null,
      endpoint: null
    }
    this.walletUID = null
    this.sdkSession = null
    this.page = 0
    this.unlockedAccount = 0
    this.network = null
    this.hdPath = STANDARD_HD_PATH
  }

  async _openConnectorTab(url) {
    try {
      const browserTab = window.open(url)
      // Preferred option for Chromium browsers. This extension runs in a window
      // for Chromium so we can do window-based communication very easily.
      if (browserTab) {
        return { chromium: browserTab }
      }
      if (browser && browser.tabs && browser.tabs.create) {
        // FireFox extensions do not run in windows, so it will return `null` from
        // `window.open`. Instead, we need to use the `browser` API to open a tab.
        // We will surveille this tab to see if its URL parameters change, which
        // will indicate that the user has logged in.
        const tab = await browser.tabs.create({ url })
        return { firefox: tab }
      }
      throw new Error('Unknown browser context. Cannot open Lattice connector.')
    } catch (err) {
      throw new Error('Failed to open Lattice connector.')
    }
  }

  async _findTabById(id) {
    const tabs = await browser.tabs.query({})
    return tabs.find((tab) => tab.id === id)
  }

  _getCreds() {
    return new Promise((resolve, reject) => {
      // We only need to setup if we don't have a deviceID
      if (this._hasCreds()) return resolve()
      // If we are not aware of what Lattice we should be talking to,
      // we need to open a window that lets the user go through the
      // pairing or connection process.
      const name = this.appName ? this.appName : 'Unknown'
      const base = 'https://lattice.gridplus.io'
      const url = `${base}?keyring=${name}&forceLogin=true`
      let listenInterval

      // PostMessage handler
      function receiveMessage(event) {
        // Ensure origin
        if (event.origin !== base) return
        try {
          // Stop the listener
          clearInterval(listenInterval)
          // Parse and return creds
          const creds = JSON.parse(event.data)
          if (!creds.deviceID || !creds.password)
            return reject(new Error('Invalid credentials returned from Lattice.'))
          return resolve(creds)
        } catch (err) {
          return reject(err)
        }
      }

      // Open the tab
      this._openConnectorTab(url).then((conn) => {
        if (conn.chromium) {
          // On a Chromium browser we can just listen for a window message
          window.addEventListener('message', receiveMessage, false)
          // Watch for the open window closing before creds are sent back
          listenInterval = setInterval(() => {
            if (conn.chromium.closed) {
              clearInterval(listenInterval)
              return reject(new Error('Lattice connector closed.'))
            }
          }, 500)
        } else if (conn.firefox) {
          // For Firefox we cannot use `window` in the extension and can't
          // directly communicate with the tabs very easily so we use a
          // workaround: listen for changes to the URL, which will contain
          // the login info.
          // NOTE: This will only work if have `https://lattice.gridplus.io/*`
          // host permissions in your manifest file (and also `activeTab` permission)
          const loginUrlParam = '&loginCache='
          listenInterval = setInterval(() => {
            this._findTabById(conn.firefox.id).then((tab) => {
              if (!tab || !tab.url) {
                return reject(new Error('Lattice connector closed.'))
              }
              // If the tab we opened contains a new URL param
              const paramLoc = tab.url.indexOf(loginUrlParam)
              if (paramLoc < 0) return
              const dataLoc = paramLoc + loginUrlParam.length
              // Stop this interval
              clearInterval(listenInterval)
              try {
                // Parse the login data. It is a stringified JSON object
                // encoded as a base64 string.
                const _creds = Buffer.from(tab.url.slice(dataLoc), 'base64').toString()
                // Close the tab and return the credentials
                browser.tabs.remove(tab.id).then(() => {
                  const creds = JSON.parse(_creds)
                  if (!creds.deviceID || !creds.password)
                    return reject(new Error('Invalid credentials returned from Lattice.'))
                  return resolve(creds)
                })
              } catch (err) {
                return reject('Failed to get login data from Lattice. Please try again.')
              }
            })
          }, 500)
        }
      })
    })
  }

  // [re]connect to the Lattice. This should be done frequently to ensure
  // the expected wallet UID is still the one active in the Lattice.
  // This will handle SafeCard insertion/removal events.
  async _connect() {
    try {
      // Attempt to connect with a Lattice using a shorter timeout. If
      // the device is unplugged it will time out and we don't need to wait
      // 2 minutes for that to happen.
      this.sdkSession.timeout = CONNECT_TIMEOUT
      await this.sdkSession.connect(this.creds.deviceID)
    } finally {
      // Reset to normal timeout no matter what
      this.sdkSession.timeout = SDK_TIMEOUT
    }
  }

  async _initSession() {
    if (this.isUnlocked()) {
      return
    }
    let url = 'https://signing.gridpl.us'
    if (this.creds.endpoint) url = this.creds.endpoint
    const setupData = {
      name: this.appName,
      baseUrl: url,
      timeout: SDK_TIMEOUT,
      privKey: this._genSessionKey(),
      network: this.network,
      skipRetryOnWrongWallet: true
    }
    /*
    NOTE: We need state to actually be synced by MetaMask or we can't
    use this. See: https://github.com/MetaMask/KeyringController/issues/130
    if (this.sdkState) {
      // If we have state data we can fully rehydrate the session.
      setupData = {
        stateData: this.sdkState,
        skipRetryOnWrongWallet: true,
      }
    }
    */
    this.sdkSession = new SDK.Client(setupData)
    // Return a boolean indicating whether we provided state data.
    // If we have, we can skip `connect`.
    return !!setupData.stateData
  }

  async _fetchAddresses(n = 1, i = 0, recursedAddrs = []) {
    if (!this.isUnlocked()) {
      throw new Error('No connection to Lattice. Cannot fetch addresses.')
    }
    return this.__fetchAddresses(n, i)
  }

  async __fetchAddresses(n = 1, i = 0, recursedAddrs = []) {
    // Determine if we need to do a recursive call here. We prefer not to
    // because they will be much slower, but Ledger paths require it since
    // they are non-standard.
    if (n === 0) {
      return recursedAddrs
    }
    const shouldRecurse = this._hdPathHasInternalVarIdx()

    // Make the request to get the requested address
    const addrData = {
      currency: 'ETH',
      startPath: this._getHDPathIndices(this.hdPath, i),
      n: shouldRecurse ? 1 : n
    }
    const addrs = await this.sdkSession.getAddresses(addrData)
    // Sanity check -- if this returned 0 addresses, handle the error
    if (addrs.length < 1) {
      throw new Error('No addresses returned')
    }
    // Return the addresses we fetched *without* updating state
    if (shouldRecurse) {
      return await this.__fetchAddresses(n - 1, i + 1, recursedAddrs.concat(addrs))
    }
    return addrs
  }

  async _getPage(increment = 0) {
    try {
      this.page += increment
      if (this.page < 0) this.page = 0
      const start = PER_PAGE * this.page
      // Otherwise unlock the device and fetch more addresses
      await this.unlock()
      const addrs = await this._fetchAddresses(PER_PAGE, start)
      const accounts = addrs.map((address, i) => {
        return {
          address,
          balance: null,
          index: start + i + 1
        }
      })
      return accounts
    } catch (err) {
      // This will get hit for a few reasons. Here are two possibilities:
      // 1. The user has a SafeCard inserted, but not unlocked
      // 2. The user fetched a page for a different wallet, then switched
      //    interface on the device
      // In either event we should try to resync the wallet and if that
      // fails throw an error
      try {
        await this._connect()
        const accounts = await this._getPage(0)
        return accounts
      } catch (err) {
        throw new Error(
          'Failed to get accounts. Please forget the device and try again. ' +
            'Make sure you do not have a locked SafeCard inserted.'
        )
      }
    }
  }

  _hasCreds() {
    return this.creds.deviceID !== null && this.creds.password !== null && this.appName
  }

  _genSessionKey() {
    if (this.name && !this.appName)
      // Migrate from legacy param if needed
      this.appName = this.name
    if (!this._hasCreds()) throw new Error('No credentials -- cannot create session key!')
    const buf = Buffer.concat([
      Buffer.from(this.creds.password),
      Buffer.from(this.creds.deviceID),
      Buffer.from(this.appName)
    ])

    return crypto.createHash('sha256').update(buf).digest()
  }

  // Determine if an HD path has a variable index internal to it.
  // e.g. m/44'/60'/x'/0/0 -> true, while m/44'/60'/0'/0/x -> false
  // This is just a hacky helper to avoid having to recursively call for non-ledger
  // derivation paths. Ledger is SO ANNOYING TO SUPPORT.
  _hdPathHasInternalVarIdx() {
    const path = this.hdPath.split('/').slice(1)
    for (let i = 0; i < path.length - 1; i++) {
      if (path[i].indexOf('x') > -1) return true
    }
    return false
  }

  _getCurrentWalletUID() {
    if (!this.sdkSession) {
      return null
    }
    const activeWallet = this.sdkSession.getActiveWallet()
    if (!activeWallet || !activeWallet.uid) {
      return null
    }
    return activeWallet.uid.toString('hex')
  }
}

export default LatticeKeyring

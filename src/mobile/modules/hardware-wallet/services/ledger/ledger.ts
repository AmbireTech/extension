import { isWeb } from '@common/config/env'
import i18n from '@common/config/localization/localization'
import { serialize } from '@ethersproject/transactions'
import AppEth from '@ledgerhq/hw-app-eth'

const ethUtil = require('ethereumjs-util')
const HDNode = require('hdkey')

const EIP_155_CONSTANT = 35

export const PARENT_HD_PATH = "44'/60'/0'/0"

const openTransport = async (device: any) => {
  if (isWeb) return null

  // #@ledgerhq/react-native-hid issue
  // Dynamically import, because modules don't support running in web mode,
  // and importing them regularly (synchronously) is causing a web app crash.
  // const TransportHID = (await import('@ledgerhq/react-native-hid')).default
  const TransportBLE = (await import('@ledgerhq/react-native-hw-transport-ble')).default

  return TransportBLE.open(device.id).catch((err: any) => {
    throw err
  })

  // return device.connectionType === 'Bluetooth'
  // ? TransportBLE.open(device.id).catch((err: any) => {
  //     throw err
  //   })
  // : TransportHID.open(device).catch((err: any) => {
  //     throw err
  //   })
}

const closeTransport = async (device: any) => {
  if (isWeb) return

  // Dynamically import, because module don't support running in web mode,
  // and importing them regularly (synchronously) is causing a web app crash.
  const TransportBLE = (await import('@ledgerhq/react-native-hw-transport-ble')).default

  if (device.connectionType === 'Bluetooth') {
    try {
      TransportBLE.disconnectDevice(device.id)
    } catch (err) {
      console.log('err', err)
      throw err
    }
  }
}

async function getAddressInternal(transport: any, parentKeyDerivationPath: any) {
  let timeoutHandle: any
  const appEth = new AppEth(transport)
  const ledgerTimeout = new Promise((resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      return reject(new Error('Device took too long to respond...'))
    }, 10000)
  })

  return Promise.race([
    appEth.getAddress(parentKeyDerivationPath, false, true),
    ledgerTimeout
  ]).then((res) => {
    clearTimeout(timeoutHandle)
    return res
  })
}

export function addressOfHDKey(hdKey: any) {
  const shouldSanitizePublicKey = true
  const derivedPublicKey = hdKey.publicKey
  const ethereumAddressUnprefixed = ethUtil
    .publicToAddress(derivedPublicKey, shouldSanitizePublicKey)
    .toString('hex')
  return ethUtil.addHexPrefix(ethereumAddressUnprefixed).toLowerCase()
}

function calculateDerivedHDKeyInfos(initialDerivedKeyInfo: any, count: any) {
  const derivedKeys = []
  for (let i = 0; i < count; i++) {
    const fullDerivationPath = `m/${initialDerivedKeyInfo.baseDerivationPath}/${i}`
    const path = `m/${i}`
    const hdKey = initialDerivedKeyInfo.hdKey.derive(path)
    const address = addressOfHDKey(hdKey)
    const derivedKey = {
      address,
      hdKey,
      baseDerivationPath: initialDerivedKeyInfo.baseDerivationPathh,
      derivationPath: fullDerivationPath
    }

    derivedKeys.push(derivedKey)
  }
  return derivedKeys
}

async function getAccounts(transport: any) {
  const parentKeyDerivationPath = `m/${PARENT_HD_PATH}`
  const returnData: any = {
    error: null,
    accounts: []
  }
  let ledgerResponse
  try {
    ledgerResponse = await getAddressInternal(transport, parentKeyDerivationPath)
      .then((o: any) => o)
      .catch((err: any) => {
        if (err.statusCode === 25871 || err.statusCode === 27404) {
          returnData.error = i18n.t(
            'Please make sure your ledger is unlocked and running the Ethereum app. {{error}}',
            { error: err.message }
          )
        } else {
          console.log(err)
          returnData.error = i18n.t('Could not get address from ledger : {{error}}', { error: err })
        }
      })
  } catch (e) {
    console.log('e', e)
  }

  if (!ledgerResponse) {
    return returnData
  }

  const hdKey = new HDNode()
  hdKey.publicKey = Buffer.from(ledgerResponse.publicKey, 'hex')
  hdKey.chainCode = Buffer.from(ledgerResponse.chainCode, 'hex')
  const mainAddress = addressOfHDKey(hdKey)

  const initialDerivedKeyInfo = {
    hdKey,
    address: mainAddress,
    derivationPath: parentKeyDerivationPath,
    baseDerivationPath: PARENT_HD_PATH
  }

  // currently we can't get addrs to match with what appears in MM/Ledger live so only one is derived
  returnData.accounts = calculateDerivedHDKeyInfos(initialDerivedKeyInfo, 1)
  return returnData
}

export async function ledgerDeviceGetAddresses(device: any) {
  const returnData = {
    error: null,
    addresses: []
  }

  const transport = await openTransport(device).catch((err: any) => {
    returnData.error = err
  })

  if (!transport) return returnData

  const accountsData = await getAccounts(transport)

  closeTransport(device)

  if (accountsData.error) {
    returnData.error = accountsData.error
  } else {
    returnData.addresses = accountsData.accounts.map((a: any) => a.address)
  }

  return returnData
}

export async function ledgerSignTransaction(txn: any, chainId: any, device: any) {
  const fromAddr = txn.from

  const unsignedTxObj = {
    ...txn,
    gasLimit: txn.gasLimit || txn.gas,
    chainId
  }
  delete unsignedTxObj.from
  delete unsignedTxObj.gas

  const serializedUnsigned = serialize(unsignedTxObj)

  const transport = await openTransport(device)

  const accountsData = await getAccounts(transport)
  if (accountsData.error) {
    closeTransport(device)
    throw new Error(accountsData.error)
  }

  // TODO: Managing multiple signers support is not implemented yet.
  // @ledgerhq/hw-app-eth works with a single address only
  // once multi-address fetching is supported,
  // a bottom sheet with the address list should be implemented
  const address = accountsData.accounts[0].address

  let serializedSigned
  if (address.toLowerCase() === fromAddr.toLowerCase()) {
    let rsvResponse
    try {
      rsvResponse = await new AppEth(transport).signTransaction(
        accountsData.accounts[0].derivationPath,
        serializedUnsigned.substr(2)
      )
    } catch (e) {
      closeTransport(device)
      throw new Error(`Could not sign transaction ${e}`)
    }

    const intV = parseInt(rsvResponse.v, 16)
    const signedChainId = Math.floor((intV - EIP_155_CONSTANT) / 2)

    if (signedChainId !== chainId) {
      closeTransport(device)
      throw new Error(`Invalid returned V 0x${rsvResponse.v}`)
    }

    delete unsignedTxObj.v
    serializedSigned = serialize(unsignedTxObj, {
      r: `0x${rsvResponse.r}`,
      s: `0x${rsvResponse.s}`,
      v: intV
    })
  } else {
    closeTransport(device)
    throw new Error('Incorrect address. Are you using the correct account/ledger?')
  }

  closeTransport(device)

  return serializedSigned
}

export async function ledgerSignMessage(hash: any, signerAddress: any, device: any) {
  const transport = await openTransport(device)

  const accountsData = await getAccounts(transport)
  if (accountsData.error) {
    closeTransport(device)
    throw new Error(accountsData.error)
  }

  // TODO: research how to implement for multiple accounts
  const account = accountsData.accounts[0]

  let signedMsg
  if (account.address.toLowerCase() === signerAddress.toLowerCase()) {
    try {
      const rsvReply = await new AppEth(transport).signPersonalMessage(
        account.derivationPath,
        hash.substr(2)
      )
      signedMsg = `0x${rsvReply.r}${rsvReply.s}${rsvReply.v.toString(16)}`
    } catch (e: any) {
      closeTransport(device)
      throw new Error(`Signature denied ${e.message}`)
    }
  } else {
    closeTransport(device)
    throw new Error('Incorrect address. Are you using the correct account/ledger?')
  }

  closeTransport(device)

  return signedMsg
}

export async function ledgerSignMessage712(
  domainSeparator: any,
  hashStructMessage: any,
  signerAddress: any,
  device: any
) {
  const transport = await openTransport(device)

  const accountsData = await getAccounts(transport)
  if (accountsData.error) {
    closeTransport(device)
    throw new Error(accountsData.error)
  }

  // TODO: research how to implement for multiple accounts
  const account = accountsData.accounts[0]

  let signedMsg
  if (account.address.toLowerCase() === signerAddress.toLowerCase()) {
    try {
      const rsvReply = await new AppEth(transport).signEIP712HashedMessage(
        account.derivationPath,
        domainSeparator,
        hashStructMessage
      )
      signedMsg = `0x${rsvReply.r}${rsvReply.s}${rsvReply.v.toString(16)}`
    } catch (e) {
      closeTransport(device)
      throw new Error(`Signature denied ${e.message}`)
    }
  } else {
    closeTransport(device)
    throw new Error('Incorrect address. Are you using the correct account/ledger?')
  }

  closeTransport(device)

  return signedMsg
}

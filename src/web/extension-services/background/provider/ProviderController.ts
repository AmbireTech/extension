/* eslint-disable @typescript-eslint/no-unused-vars */
import 'reflect-metadata'

import { EthereumProviderError, ethErrors } from 'eth-rpc-errors'
import { getAddress, toBeHex } from 'ethers'
import cloneDeep from 'lodash/cloneDeep'
import { nanoid } from 'nanoid'

import { MainController } from '@ambire-common/controllers/main/main'
import { DappProviderRequest } from '@ambire-common/interfaces/dapp'
import { SignUserRequest } from '@ambire-common/interfaces/userRequest'
import { isErc4337Broadcast } from '@ambire-common/libs/userOperation/userOperation'
import bundler from '@ambire-common/services/bundlers'
import { getRpcProvider } from '@ambire-common/services/provider'
import { APP_VERSION } from '@common/config/env'
import { NETWORKS } from '@common/constants/networks'
import { delayPromise } from '@common/utils/promises'
import { browser } from '@web/constants/browserapi'
import { SAFE_RPC_METHODS } from '@web/constants/common'
import { DappsController } from '@web/extension-services/background/controllers/dapps'

import { ProviderNeededControllers, RequestRes, Web3WalletPermission } from './types'

type ProviderRequest = DappProviderRequest & { requestRes: RequestRes }

const handleSignMessage = (requestRes: RequestRes) => {
  if (requestRes) {
    if (requestRes?.error) {
      throw ethErrors.rpc.invalidParams({
        message: requestRes?.error
      })
    }

    return requestRes?.hash
  }

  throw new Error('Internal error: request result not found', requestRes)
}

export class ProviderController {
  mainCtrl: MainController

  dappsCtrl: DappsController

  isUnlocked: boolean

  constructor(mainCtrl: MainController, dappsCtrl: DappsController) {
    this.mainCtrl = mainCtrl
    this.dappsCtrl = dappsCtrl

    this.isUnlocked = this.mainCtrl.keystore.isReadyToStoreKeys
      ? this.mainCtrl.keystore.isUnlocked
      : true
  }

  getDappNetwork = (origin: string) => {
    const defaultNetwork = this.mainCtrl.settings.networks.find((n) => n.id === NETWORKS.ethereum)
    if (!defaultNetwork)
      throw new Error(
        'Missing default network data, which should never happen. Please contact support.'
      )

    const dappChainId = this.dappsCtrl.getDapp(origin)?.chainId
    if (!dappChainId) return defaultNetwork

    return (
      this.mainCtrl.settings.networks.find((n) => n.chainId === BigInt(dappChainId)) ||
      defaultNetwork
    )
  }

  ethRpc = async (request: DappProviderRequest) => {
    const {
      method,
      params,
      session: { origin }
    } = request

    const networkId = this.getDappNetwork(origin).id
    const provider = this.mainCtrl.settings.providers[networkId]

    if (!this.dappsCtrl.hasPermission(origin) && !SAFE_RPC_METHODS.includes(method)) {
      throw ethErrors.provider.unauthorized()
    }

    return provider.send(method, params)
  }

  ethRequestAccounts = async ({ session: { origin } }: DappProviderRequest) => {
    if (!this.dappsCtrl.hasPermission(origin) || !this.isUnlocked) {
      throw ethErrors.provider.unauthorized()
    }

    const account = this.mainCtrl.selectedAccount ? [this.mainCtrl.selectedAccount] : []
    this.dappsCtrl.broadcastDappSessionEvent('accountsChanged', account)

    return account
  }

  @Reflect.metadata('SAFE', true)
  ethAccounts = async ({ session: { origin } }: DappProviderRequest) => {
    if (!this.dappsCtrl.hasPermission(origin) || !this.isUnlocked) {
      return []
    }

    return this.mainCtrl.selectedAccount ? [this.mainCtrl.selectedAccount] : []
  }

  ethCoinbase = async ({ session: { origin } }: DappProviderRequest) => {
    if (!this.dappsCtrl.hasPermission(origin) || !this.isUnlocked) {
      return null
    }

    return this.mainCtrl.selectedAccount || null
  }

  @Reflect.metadata('SAFE', true)
  ethChainId = async ({ session: { origin } }: DappProviderRequest) => {
    if (this.dappsCtrl.hasPermission(origin)) {
      return toBeHex(this.dappsCtrl.getDapp(origin)?.chainId || 1)
    }
    return toBeHex(1)
  }

  @Reflect.metadata('ACTION_REQUEST', ['SendTransaction', false])
  ethSendTransaction = async (request: ProviderRequest) => {
    const { session } = request
    const { requestRes } = cloneDeep(request)

    if (requestRes?.hash) {
      // @erc4337
      // check if the request is erc4337
      // if it is, the received requestRes?.hash is an userOperationHash
      // Call the bundler to receive the transaction hash needed by the dapp
      const dappNetwork = this.getDappNetwork(session.origin)
      const network = this.mainCtrl.settings.networks.filter((net) => net.id === dappNetwork.id)[0]
      const accountState =
        this.mainCtrl.accountStates?.[this.mainCtrl.selectedAccount!]?.[network.id]
      if (!accountState) return requestRes?.hash

      const is4337Broadcast = isErc4337Broadcast(network, accountState)
      let hash = requestRes?.hash
      if (is4337Broadcast) {
        hash = (await bundler.pollTxnHash(hash, network)).transactionHash
        if (!hash) throw new Error('Transaction failed!')
      }

      // delay just for better UX
      // when the action-window is closed and the user views the dapp, we wait for the user
      // to see the actual update in the dapp's UI once the request is resolved.
      await delayPromise(400)
      return hash
    }

    throw new Error('Transaction failed!')
  }

  @Reflect.metadata('SAFE', true)
  netVersion = ({ session: { origin } }: any) => this.getDappNetwork(origin).chainId.toString()

  @Reflect.metadata('SAFE', true)
  web3ClientVersion = () => {
    return `Ambire v${APP_VERSION}`
  }

  @Reflect.metadata('ACTION_REQUEST', ['SignText', false])
  personalSign = async ({ requestRes }: ProviderRequest) => {
    return handleSignMessage(requestRes)
  }

  @Reflect.metadata('ACTION_REQUEST', ['SignTypedData', false])
  ethSignTypedData = async ({ requestRes }: ProviderRequest) => {
    return handleSignMessage(requestRes)
  }

  @Reflect.metadata('ACTION_REQUEST', ['SignTypedData', false])
  ethSignTypedDataV1 = async ({ requestRes }: ProviderRequest) => {
    return handleSignMessage(requestRes)
  }

  @Reflect.metadata('ACTION_REQUEST', ['SignTypedData', false])
  ethSignTypedDataV3 = async ({ requestRes }: ProviderRequest) => {
    return handleSignMessage(requestRes)
  }

  @Reflect.metadata('ACTION_REQUEST', ['SignTypedData', false])
  ethSignTypedDataV4 = async ({ requestRes }: ProviderRequest) => {
    return handleSignMessage(requestRes)
  }

  @Reflect.metadata('ACTION_REQUEST', [
    'AddChain',
    ({
      request,
      controllers
    }: {
      request: ProviderRequest
      controllers: ProviderNeededControllers
    }) => {
      const { mainCtrl, dappsCtrl } = controllers
      const { params, session } = request
      if (!params[0]) {
        throw ethErrors.rpc.invalidParams('params is required but got []')
      }
      if (!params[0]?.chainId) {
        throw ethErrors.rpc.invalidParams('chainId is required')
      }
      const dapp = dappsCtrl.getDapp(session.origin)
      const { chainId } = params[0]
      const network = mainCtrl.settings.networks.find(
        (n: any) => Number(n.chainId) === Number(chainId)
      )
      if (!network || !dapp?.isConnected) return false

      return true
    }
  ])
  walletAddEthereumChain = ({
    params: [chainParams],
    session: { origin, name }
  }: ProviderRequest) => {
    let chainId = chainParams.chainId
    if (typeof chainId === 'string') {
      chainId = Number(chainId)
    }

    const network = this.mainCtrl.settings.networks.find((n) => Number(n.chainId) === chainId)

    if (!network) {
      throw new Error('This chain is not supported by Ambire yet.')
    }

    this.dappsCtrl.updateDapp(origin, { chainId })
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      await browser.notifications.create(nanoid(), {
        type: 'basic',
        iconUrl: browser.runtime.getURL('assets/images/xicon@96.png'),
        title: 'Network added',
        message: `Network switched to ${network.name} for ${name || origin}.`
      })
    })()
    this.dappsCtrl.broadcastDappSessionEvent(
      'chainChanged',
      {
        chain: toBeHex(network.chainId),
        networkVersion: `${network.chainId}`
      },
      origin
    )

    return null
  }

  // explain to the dapp what features the wallet has for the selected account
  walletGetCapabilities = async (data: any) => {
    if (!this.dappsCtrl.hasPermission(data.session.origin) || !this.isUnlocked) {
      throw ethErrors.provider.unauthorized()
    }

    if (!data.params || !data.params.length) {
      throw ethErrors.rpc.invalidParams('params is required but got []')
    }

    const accountAddr = data.params[0]
    const state = this.mainCtrl.accountStates[accountAddr]
    if (!state) {
      throw ethErrors.rpc.invalidParams(`account with address ${accountAddr} does not exist`)
    }

    const capabilities: any = {}
    this.mainCtrl.settings.networks.forEach((network) => {
      capabilities[toBeHex(network.chainId)] = {
        atomicBatch: {
          supported: !this.mainCtrl.accountStates[accountAddr][network.id].isEOA
        },
        paymasterService: {
          supported:
            this.mainCtrl.accountStates[accountAddr][network.id].isV2 && network.erc4337.enabled
        }
      }
    })
    return capabilities
  }

  @Reflect.metadata('NOTIFICATION_REQUEST', ['SendTransaction', false])
  walletSendCalls = async (data: any) => {
    if (data.requestRes && data.requestRes.hash) return data.requestRes.hash
  }

  walletGetCallsStatus = async (data: any) => {
    if (!data.params || !data.params.length) {
      throw ethErrors.rpc.invalidParams('params is required but got []')
    }

    const id = data.params[0]
    if (!id) throw ethErrors.rpc.invalidParams('no identifier passed')

    const dappNetwork = this.getDappNetwork(data.session.origin)
    const network = this.mainCtrl.settings.networks.filter((net) => net.id === dappNetwork.id)[0]
    const accountState =
      this.mainCtrl.accountStates?.[this.mainCtrl.selectedAccount!]?.[network.id]!
    if (!accountState) throw ethErrors.rpc.invalidParams('account state not found')
    const txnId = isErc4337Broadcast(network, accountState)
      ? (await bundler.pollTxnHash(id, network)).transactionHash
      : id
    if (!txnId) return undefined

    const provider = getRpcProvider(network.rpcUrls, network.chainId, network.selectedRpcUrl)
    const receipt = await provider.getTransactionReceipt(txnId)
    if (!receipt) {
      return {
        status: 'PENDING'
      }
    }

    return {
      status: 'CONFIRMED',
      receipts: [receipt]
    }
  }

  @Reflect.metadata('ACTION_REQUEST', [
    'AddChain',
    ({
      request,
      controllers
    }: {
      request: ProviderRequest
      controllers: ProviderNeededControllers
    }) => {
      const { mainCtrl, dappsCtrl } = controllers
      const { params, session } = request
      if (!params[0]) {
        throw ethErrors.rpc.invalidParams('params is required but got []')
      }
      if (!params[0]?.chainId) {
        throw ethErrors.rpc.invalidParams('chainId is required')
      }
      const dapp = dappsCtrl.getDapp(session.origin)
      const { chainId } = params[0]
      const network = mainCtrl.settings.networks.find(
        (n: any) => Number(n.chainId) === Number(chainId)
      )
      if (!dapp?.isConnected) return false

      if (!network) {
        throw ethErrors.provider.custom({
          code: 4902,
          message:
            'Unrecognized chain ID. Try adding the chain using wallet_addEthereumChain first.'
        })
      }
      return true
    }
  ])
  walletSwitchEthereumChain = ({
    params: [chainParams],
    session: { origin, name }
  }: ProviderRequest) => {
    let chainId = chainParams.chainId
    if (typeof chainId === 'string') {
      chainId = Number(chainId)
    }
    const network = this.mainCtrl.settings.networks.find((n) => Number(n.chainId) === chainId)

    if (!network) {
      throw new Error('This chain is not supported by Ambire yet.')
    }

    this.dappsCtrl.updateDapp(origin, { chainId })
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      await browser.notifications.create(nanoid(), {
        type: 'basic',
        iconUrl: browser.runtime.getURL('assets/images/xicon@96.png'),
        title: 'Successfully switched network',
        message: `Network switched to ${network.name} for ${name || origin}.`
      })
    })()
    this.dappsCtrl.broadcastDappSessionEvent(
      'chainChanged',
      {
        chain: toBeHex(network.chainId),
        networkVersion: `${network.chainId}`
      },
      origin
    )

    return null
  }

  @Reflect.metadata('ACTION_REQUEST', ['WalletWatchAsset', false])
  walletWatchAsset = () => true

  @Reflect.metadata('ACTION_REQUEST', ['GetEncryptionPublicKey', false])
  ethGetEncryptionPublicKey = ({ requestRes }: ProviderRequest) => ({
    result: requestRes
  })

  walletRequestPermissions = ({ params: permissions }: DappProviderRequest) => {
    const result: Web3WalletPermission[] = []
    if (permissions && 'eth_accounts' in permissions[0]) {
      result.push({ parentCapability: 'eth_accounts' })
    }
    return result
  }

  @Reflect.metadata('SAFE', true)
  walletGetPermissions = ({ session: { origin } }: DappProviderRequest) => {
    const result: Web3WalletPermission[] = []
    if (this.dappsCtrl.getDapp(origin) && this.isUnlocked) {
      result.push({ parentCapability: 'eth_accounts' })
    }
    return result
  }

  personalEcRecover = ({ params: [data, sig, extra = {}] }: DappProviderRequest) => {
    // TODO:
  }

  @Reflect.metadata('SAFE', true)
  netListening = () => {
    return true
  }
}

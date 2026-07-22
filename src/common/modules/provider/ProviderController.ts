/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethErrors } from 'eth-rpc-errors'
import { getAddress, isAddress } from 'ethers'
import cloneDeep from 'lodash/cloneDeep'
import { nanoid } from 'nanoid'

import { Session } from '@ambire-common/classes/session'
import { MainController } from '@ambire-common/controllers/main/main'
import { ConnectionSource, DappProviderRequest } from '@ambire-common/interfaces/dapp'
import { UiManager } from '@ambire-common/interfaces/ui'
import {
  getFailureStatus,
  getPendingStatus,
  getSuccessStatus,
  getVersion
} from '@ambire-common/libs/5792/5792'
import { getBaseAccount } from '@ambire-common/libs/account/getBaseAccount'
import {
  AccountOpIdentifiedBy,
  isIdentifiedByMultipleTxn
} from '@ambire-common/libs/accountOp/submittedAccountOp'
import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import { getAccountsForDapp } from '@ambire-common/libs/dapps/helpers'
import { networkChainIdToHex } from '@ambire-common/libs/networks/networks'
import { getBenzinUrlParams } from '@ambire-common/utils/benzin'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import { APP_VERSION } from '@common/config/env'
import { SAFE_RPC_METHODS } from '@common/modules/inpage/methods'
import { metadata } from '@common/modules/provider/metadata'
import { RequestRes, Web3WalletPermission } from '@common/modules/provider/types'
import { openInTab } from '@common/utils/links'

import type { TokenResult } from '@ambire-common/libs/portfolio'
type ProviderRequest = DappProviderRequest & { requestRes: RequestRes }

// Derive the connection source from the session, mirroring rpcFlow.ts: WC sessions carry a
// wcTopic, injected (in-app browser / extension content script) ones don't. Each source has its
// own permission entry, so connection checks must be scoped to the channel the request came from -
// otherwise a dapp connected only via WalletConnect would auto-connect in the in-app browser
// (eth_accounts/getProviderState would return the account list and the dapp would skip the connect prompt).
const getRequestSource = (session: Session): ConnectionSource =>
  session.wcTopic ? 'wc' : 'injected'

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

function getSelectedAccount(mainCtrl: MainController, id: string): string | undefined {
  const extensionSelectedAccount = mainCtrl.selectedAccount.account?.addr
  const preferences = mainCtrl.dapps.getDapp(id)?.accountPreferences

  if (
    !preferences ||
    !preferences.enabled ||
    (extensionSelectedAccount && preferences.accounts.includes(extensionSelectedAccount))
  ) {
    return extensionSelectedAccount
  }

  return preferences.selectedAccount
}

export class ProviderController {
  mainCtrl: MainController

  isUnlocked: boolean
  private notificationManager: UiManager['notification']

  constructor(mainCtrl: MainController, notificationManager: UiManager['notification']) {
    this.mainCtrl = mainCtrl
    this.notificationManager = notificationManager

    this.isUnlocked = this.mainCtrl.keystore.isReadyToStoreKeys
      ? this.mainCtrl.keystore.isUnlocked
      : true
  }

  _getSelectedAccount(id: string) {
    // If enabled and the extension's selected account is not a part of the allowed accounts, return
    // the last selected account from the dapp preferences
    return getSelectedAccount(this.mainCtrl, id)
  }

  _internalGetAccounts = (id: string) => {
    const dapp = this.mainCtrl.dapps.getDapp(id)
    if (!dapp) return []

    const accounts = getAccountsForDapp(
      dapp.accountPreferences,
      this.mainCtrl.selectedAccount.account?.addr
    )

    return accounts
  }

  getDappNetwork = (id: string) => {
    const defaultNetwork = this.mainCtrl.networks.networks.find((n) => n.chainId === 1n)
    if (!defaultNetwork)
      throw new Error(
        'Missing default network data, which should never happen. Please contact support.'
      )

    const dappChainId = this.mainCtrl.dapps.getDapp(id)?.chainId
    if (!dappChainId) return defaultNetwork

    return (
      this.mainCtrl.networks.networks.find((n) => n.chainId === BigInt(dappChainId)) ||
      defaultNetwork
    )
  }

  ethRpc = async (request: DappProviderRequest) => {
    const { method, params, session } = request
    const { id } = session

    const chainId = this.getDappNetwork(id).chainId
    const provider = this.mainCtrl.providers.providers[chainId.toString()]

    if (
      !this.mainCtrl.dapps.hasPermission(id, getRequestSource(session)) &&
      !SAFE_RPC_METHODS.includes(method)
    ) {
      throw ethErrors.provider.unauthorized()
    }
    if (!provider) throw ethErrors.rpc.invalidParams('provider not found')

    return provider.send(method, params)
  }

  ethRequestAccounts = async ({ session }: DappProviderRequest) => {
    const { id, origin } = session
    if (!this.mainCtrl.dapps.hasPermission(id, getRequestSource(session)) || !this.isUnlocked) {
      throw ethErrors.provider.unauthorized()
    }

    const accounts = this._internalGetAccounts(id)

    await this.mainCtrl.dapps.broadcastDappSessionEvent('accountsChanged', accounts)

    return accounts
  }

  getPortfolioBalance = async ({ params: [chainParams], session }: DappProviderRequest) => {
    if (
      !this.mainCtrl.dapps.hasPermission(session.id, getRequestSource(session)) ||
      !this.isUnlocked
    ) {
      throw ethErrors.provider.unauthorized()
    }

    const selectedAccount = this._getSelectedAccount(session.id)

    if (!selectedAccount) {
      throw new Error('wallet account not selected')
    }

    if (selectedAccount !== this.mainCtrl.selectedAccount.account?.addr) {
      const amount = this.mainCtrl.selectedAccount.balanceByAccounts[selectedAccount] || 0

      return {
        amount,
        amountFormatted: formatDecimals(amount, 'price'),
        isReady: true
      }
    }

    let totalBalance: number = 0

    if (chainParams && chainParams.chainIds?.length) {
      chainParams.chainIds.forEach((chainId: string) => {
        const network = this.mainCtrl.networks.networks.find(
          (n) => Number(n.chainId) === Number(chainId)
        )
        if (!network) return

        totalBalance +=
          this.mainCtrl.selectedAccount.portfolio.balancePerNetwork[network.chainId.toString()] || 0
      })
    } else {
      totalBalance = this.mainCtrl.selectedAccount.portfolio.totalBalance
    }

    return {
      amount: totalBalance,
      amountFormatted: formatDecimals(totalBalance, 'price'),
      isReady: this.mainCtrl.selectedAccount.portfolio.isAllReady
    }
  }

  // ERC-7811 https://github.com/ethereum/ERCs/pull/709/
  // Adding 'custom' in then name as the ERC is still not completed and might update some
  // specifications.
  // Caveat: If called for an account different than the currently selected account in the extension,
  // we may return stale data.
  walletCustomGetAssets = async ({
    params: { account, assetFilter: _assetFilter },
    session
  }: DappProviderRequest) => {
    const assetFilter = _assetFilter as { [a: string]: string[] }

    if (
      !this.mainCtrl.dapps.hasPermission(session.id, getRequestSource(session)) ||
      !this.isUnlocked
    ) {
      throw ethErrors.provider.unauthorized()
    }

    if (!this.mainCtrl.selectedAccount.account) {
      throw new Error('wallet account not selected')
    }

    if (typeof assetFilter !== 'object') throw new Error('Wrong request data format')

    const res: { [chainId: string]: any[] } = {}

    const accounts = this._internalGetAccounts(session.id)

    if (!accounts.some((acc) => acc.toLowerCase() === account.toLowerCase())) {
      throw ethErrors.provider.unauthorized()
    }

    // NOTE!: This method is not used at the time of writing this.
    // If it's ever used, handle the case where the account doesn't have a portfolio or the portfolio is being
    // updated.
    const portfolio = this.mainCtrl.portfolio.getAccountPortfolioState(account)

    Object.entries(assetFilter).forEach(([chainId, tokens]: [string, string[]]) => {
      if (!res[chainId]) res[chainId] = []
      const network = this.mainCtrl.networks.networks.find(
        (n) => Number(n.chainId) === Number(chainId)
      )
      if (!network) return

      const tokensInPortfolio: TokenResult[] | undefined = portfolio?.[chainId]?.result?.tokens

      if (!tokensInPortfolio) return

      tokens.forEach((requestedTokenAddress) => {
        const token = (tokensInPortfolio || []).find(
          ({ address, chainId: tChainId, amount, amountPostSimulation }) => {
            return (
              address === requestedTokenAddress &&
              tChainId === network.chainId &&
              (typeof amount === 'bigint' || typeof amountPostSimulation === 'bigint')
            )
          }
        )
        if (!token) return
        res[chainId]!.push({
          address: token.address,
          balance: `0x${(token.amountPostSimulation || token.amount || 0).toString(16)}`,
          type: 'ERC20',
          metadata: {
            symbol: token.symbol,
            decimals: token.decimals,
            name: token.name
          }
        })
      })
    })

    return res
  }

  @metadata('SAFE', true)
  ethAccounts = async ({ session }: DappProviderRequest) => {
    const { id } = session
    if (!this.mainCtrl.dapps.hasPermission(id, getRequestSource(session)) || !this.isUnlocked) {
      return []
    }

    return this._internalGetAccounts(id)
  }

  ethCoinbase = async ({ session }: DappProviderRequest) => {
    if (
      !this.mainCtrl.dapps.hasPermission(session.id, getRequestSource(session)) ||
      !this.isUnlocked
    ) {
      return null
    }

    return this._getSelectedAccount(session.id) || null
  }

  @metadata('SAFE', true)
  ethChainId = async ({ session }: DappProviderRequest) => {
    if (this.mainCtrl.dapps.hasPermission(session.id, getRequestSource(session))) {
      return networkChainIdToHex(this.mainCtrl.dapps.getDapp(session.id)?.chainId || 1)
    }
    return networkChainIdToHex(1)
  }

  @metadata('ACTION_REQUEST', ['SendTransaction', false])
  ethSendTransaction = async (request: ProviderRequest) => {
    const { requestRes } = cloneDeep(request)
    if (requestRes?.hash) return requestRes.hash
    throw new Error('Transaction failed!')
  }

  @metadata('SAFE', true)
  netVersion = ({ session: { id } }: any) => this.getDappNetwork(id).chainId.toString()

  @metadata('SAFE', true)
  web3ClientVersion = () => {
    return `Ambire v${APP_VERSION}`
  }

  @metadata('ACTION_REQUEST', ['SignText', false])
  personalSign = async ({ requestRes }: ProviderRequest) => {
    return handleSignMessage(requestRes)
  }

  @metadata('ACTION_REQUEST', ['SignTypedData', false])
  ethSignTypedData = async ({ requestRes }: ProviderRequest) => {
    return handleSignMessage(requestRes)
  }

  @metadata('ACTION_REQUEST', ['SignTypedData', false])
  ethSignTypedDataV1 = async ({ requestRes }: ProviderRequest) => {
    return handleSignMessage(requestRes)
  }

  @metadata('ACTION_REQUEST', ['SignTypedData', false])
  ethSignTypedDataV3 = async ({ requestRes }: ProviderRequest) => {
    return handleSignMessage(requestRes)
  }

  @metadata('ACTION_REQUEST', ['SignTypedData', false])
  ethSignTypedDataV4 = async ({ requestRes }: ProviderRequest) => {
    return handleSignMessage(requestRes)
  }

  @metadata('ACTION_REQUEST', [
    'AddChain',
    ({ request }: { request: ProviderRequest; mainCtrl: MainController }) => {
      const chainParams = request.params[0]

      if (!chainParams)
        throw ethErrors.rpc.invalidParams(
          'Missing network details. Please specify a chain ID and the required network information.'
        )

      if (!chainParams?.chainId || typeof chainParams.chainId !== 'string')
        throw ethErrors.rpc.invalidParams(
          `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received: ${chainParams?.chainId}`
        )

      const { chainId } = chainParams
      const chainIdNumber = Number(chainId)
      if (isNaN(chainIdNumber) || chainIdNumber > Number.MAX_SAFE_INTEGER)
        throw ethErrors.rpc.invalidParams(
          `Invalid chain ID "${chainId}": numerical value greater than max safe value. Received: ${chainId}`
        )

      if (!chainParams?.chainName || typeof chainParams.chainName !== 'string') {
        throw ethErrors.rpc.invalidParams("'chainName' is required and must be a string")
      }

      if (!chainParams?.nativeCurrency || typeof chainParams.nativeCurrency !== 'object')
        throw ethErrors.rpc.invalidParams("'nativeCurrency' is required and must be an object")

      const { nativeCurrency } = chainParams
      if (
        !nativeCurrency.decimals ||
        typeof nativeCurrency.decimals !== 'number' ||
        !Number.isInteger(nativeCurrency.decimals)
      )
        throw ethErrors.rpc.invalidParams(
          "'nativeCurrency.decimals' is required and must be an integer"
        )

      if (!nativeCurrency.name || typeof nativeCurrency.name !== 'string')
        throw ethErrors.rpc.invalidParams("'nativeCurrency.name' is required and must be a string")

      if (!nativeCurrency.symbol || typeof nativeCurrency.symbol !== 'string')
        throw ethErrors.rpc.invalidParams(
          "'nativeCurrency.symbol' is required and must be a string"
        )

      const ticker = nativeCurrency.symbol
      if (ticker.length < 2 || ticker.length > 6)
        throw ethErrors.rpc.invalidParams(
          `Expected 2-6 character string 'nativeCurrency.symbol'. Received: ${ticker}`
        )

      // Validate rpcUrls
      if (!chainParams?.rpcUrls || !Array.isArray(chainParams.rpcUrls))
        throw ethErrors.rpc.invalidParams("'rpcUrls' is required and must be an array")
      if (chainParams.rpcUrls.length === 0)
        throw ethErrors.rpc.invalidParams("'rpcUrls' must contain at least one URL")

      if (!chainParams.rpcUrls.every((url: any) => typeof url === 'string'))
        throw ethErrors.rpc.invalidParams("'rpcUrls' must be an array of strings")

      return false
    }
  ])
  walletAddEthereumChain = async ({ params: [chainParams], session: { id } }: ProviderRequest) => {
    const chainId = Number(chainParams.chainId)
    const network = this.mainCtrl.networks.networks.find((n) => Number(n.chainId) === chainId)

    // should never happen
    if (!network)
      throw new Error(
        'Something went wrong while adding the network. Please try again later or contact Ambire support.'
      )

    this.mainCtrl.dapps.updateDapp(id, { chainId })
    await this.mainCtrl.dapps.broadcastDappSessionEvent(
      'chainChanged',
      {
        chain: `0x${network.chainId.toString(16)}`,
        networkVersion: `${network.chainId}`
      },
      id
    )

    return null
  }

  // explain to the dapp what features the wallet has for the selected account
  walletGetCapabilities = async (data: any) => {
    if (
      !this.mainCtrl.dapps.hasPermission(data.session.id, getRequestSource(data.session)) ||
      !this.isUnlocked
    ) {
      throw ethErrors.provider.unauthorized()
    }

    if (!data.params || !data.params.length) {
      throw ethErrors.rpc.invalidParams('params is required but got []')
    }

    const accountAddr = data.params[0]
    const state = this.mainCtrl.accounts.accountStates[accountAddr]
    if (!state) {
      throw ethErrors.rpc.invalidParams(`account with address ${accountAddr} does not exist`)
    }

    const states = await this.mainCtrl.accounts.getOrFetchAccountStates(accountAddr)
    const capabilities: any = {}
    this.mainCtrl.networks.networks.forEach((network) => {
      const accountState = states[network.chainId.toString()]

      // if there's no account state for some reason (RPC not working atm),
      // we should play it safe and return false for everything
      if (!accountState) {
        capabilities[networkChainIdToHex(network.chainId)] = {
          atomicBatch: {
            supported: false
          },
          auxiliaryFunds: {
            supported: false
          },
          paymasterService: {
            supported: false
          },
          atomic: {
            status: 'unsupported'
          }
        }
        return
      }

      const accout = this.mainCtrl.accounts.accounts.find((acc) => acc.addr === accountAddr)!
      const baseAccount = getBaseAccount(accout, accountState, network)
      const isSmart = baseAccount.getAtomicStatus() !== 'unsupported'

      capabilities[networkChainIdToHex(network.chainId)] = {
        atomicBatch: {
          supported: true
        },
        auxiliaryFunds: {
          supported: isSmart
        },
        paymasterService: {
          supported:
            isSmart &&
            !accout.safeCreation &&
            // enabled: obvious, it means we're operaring with 4337
            // hasBundlerSupport means it might not be 4337 but we support it
            // our default may be the relayer but we will broadcast an userOp
            // in case of sponsorships
            network.erc4337.hasBundlerSupport
        },
        atomic: {
          status: baseAccount.getAtomicStatus()
        }
      }
    })
    return capabilities
  }

  @metadata('ACTION_REQUEST', ['SendTransaction', false])
  walletSendCalls = async (data: any) => {
    if (data.requestRes && data.requestRes.hash) {
      const version = data.params?.[0]?.version
      if (version === '2.0.0')
        return {
          id: data.requestRes.hash
        }

      // v1 response
      return data.requestRes.hash
    }

    throw new Error('Transaction failed!')
  }

  walletGetCallsStatus = async (data: any): Promise<any> => {
    if (!data.params || !data.params.length) {
      throw ethErrors.rpc.invalidParams('params is required but got []')
    }

    const id = data.params[0]
    if (!id) throw ethErrors.rpc.invalidParams('no identifier passed')

    const splitInParts = id.split(':')
    if (splitInParts.length < 2) throw ethErrors.rpc.invalidParams('invalid identifier passed')

    const type = splitInParts[0]
    const identifier = splitInParts[1]
    const bundlerName = splitInParts.length >= 3 ? splitInParts[2] : undefined
    const identifiedBy: AccountOpIdentifiedBy = {
      type,
      identifier,
      bundler: bundlerName
    }
    if (!identifier) throw ethErrors.rpc.invalidParams('no identifier passed')

    const dappNetwork = this.getDappNetwork(data.session.id)
    const network = this.mainCtrl.networks.networks.filter(
      (n) => n.chainId === dappNetwork.chainId
    )[0]
    if (!network) throw ethErrors.rpc.invalidParams('invalid chain')

    const selectedAccount = this._getSelectedAccount(data.session.id)

    const accOp = selectedAccount
      ? this.mainCtrl.activity.findByIdentifiedBy(identifiedBy, selectedAccount, network.chainId)
      : undefined
    const version = getVersion(accOp)

    if (!accOp) throw ethErrors.rpc.invalidParams('invalid identifier passed')

    if (
      accOp.status === AccountOpStatus.Rejected ||
      accOp.status === AccountOpStatus.UnknownButPastNonce ||
      accOp.status === AccountOpStatus.BroadcastButStuck
    ) {
      return {
        status: getFailureStatus(version)
      }
    }

    if (
      !accOp.status ||
      accOp.status === AccountOpStatus.BroadcastedButNotConfirmed ||
      accOp.status === AccountOpStatus.Pending ||
      !accOp.txnId
    ) {
      return {
        status: getPendingStatus(version)
      }
    }

    const provider = this.mainCtrl.providers.providers[network.chainId.toString()]

    // check to satisfy the TS; should never happen
    if (!provider) {
      throw ethErrors.rpc.internal(
        `RPC provider with chainId: ${network.chainId.toString()} not found`
      )
    }

    if (identifiedBy.type === 'UserOperation') {
      return {
        version,
        id: identifiedBy,
        atomic: true,
        status: getSuccessStatus(version),
        receipts: [
          {
            logs: [],
            status: accOp.status === AccountOpStatus.Success ? '0x1' : '0x0',
            chainId: networkChainIdToHex(network.chainId),
            blockHash: accOp.blockHash,
            gasUsed: accOp.gasUsed,
            blockNumber: accOp.blockNumber,
            transactionHash: accOp.txnId
          }
        ]
      }
    }

    const receipts = []
    const isMultipleTxn = isIdentifiedByMultipleTxn(identifiedBy)
    if (!isMultipleTxn) {
      receipts.push({
        logs: [],
        status: accOp.status === AccountOpStatus.Success ? '0x1' : '0x0',
        chainId: networkChainIdToHex(network.chainId),
        blockHash: accOp.blockHash,
        gasUsed: accOp.gasUsed,
        blockNumber: accOp.blockNumber,
        transactionHash: accOp.txnId
      })
    } else {
      for (let i = 0; i < accOp.calls.length; i++) {
        const call = accOp.calls[i]!
        receipts.push({
          logs: [],
          status: call.status === AccountOpStatus.Success ? '0x1' : '0x0',
          chainId: networkChainIdToHex(network.chainId),
          blockHash: call.blockHash,
          gasUsed: call.gasUsed,
          blockNumber: call.blockNumber,
          transactionHash: call.txnId
        })
      }
    }

    return {
      version,
      id: identifiedBy,
      atomic: !isMultipleTxn,
      status: getSuccessStatus(version),
      receipts
    }
  }

  walletGetCurrentAutoLoginPolicy = ({ session: { origin, id } }: DappProviderRequest) => {
    const appCurrentChainId = this.mainCtrl.dapps.getDapp(id)?.chainId

    if (!this.mainCtrl.autoLogin.settings.enabled)
      return {
        activePolicy: null
      }

    const policy = this.mainCtrl.autoLogin.getAccountPolicyForOrigin(
      this._getSelectedAccount(id) || '',
      origin,
      appCurrentChainId
    )

    return {
      activePolicy: policy
    }
  }

  // open benzina in a separate tab upon a dapp request
  walletShowCallsStatus = async (data: any) => {
    if (!data.params || !data.params.length) {
      throw ethErrors.rpc.invalidParams('params is required but got []')
    }

    const id = data.params[0]
    if (!id) throw ethErrors.rpc.invalidParams('no identifier passed')

    const splitInParts = id.split(':')
    if (splitInParts.length < 2) throw ethErrors.rpc.invalidParams('invalid identifier passed')

    const type = splitInParts[0]
    const identifier = splitInParts[1]
    const bundlerName = splitInParts.length >= 3 ? splitInParts[2] : undefined
    const identifiedBy: AccountOpIdentifiedBy = {
      type,
      identifier,
      bundler: bundlerName
    }

    const dappNetwork = this.getDappNetwork(data.session.id)
    const network = this.mainCtrl.networks.networks.filter(
      (n) => n.chainId === dappNetwork.chainId
    )[0]
    if (!network) throw ethErrors.rpc.invalidParams('invalid chain')
    const chainId = Number(network.chainId)

    const link = `https://explorer.ambire.com/${getBenzinUrlParams({
      txnId: identifiedBy.type === 'Transaction' ? identifiedBy.identifier : null,
      chainId,
      identifiedBy
    })}`

    await openInTab({ url: link })
  }

  @metadata('ACTION_REQUEST', [
    'AddChain',
    ({ request, mainCtrl }: { request: ProviderRequest; mainCtrl: MainController }) => {
      const chainParams = request.params[0]
      if (!chainParams)
        throw ethErrors.rpc.invalidParams(
          'Missing network details. Please specify a chain ID and the required network information.'
        )

      if (!chainParams?.chainId || typeof chainParams.chainId !== 'string')
        throw ethErrors.rpc.invalidParams(
          `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received: ${chainParams?.chainId}`
        )

      const { chainId } = chainParams
      const chainIdNumber = Number(chainId)
      if (isNaN(chainIdNumber) || chainIdNumber > Number.MAX_SAFE_INTEGER)
        throw ethErrors.rpc.invalidParams(
          `Invalid chain ID "${chainId}": numerical value greater than max safe value. Received: ${chainId}`
        )

      const dapp = mainCtrl.dapps.getDapp(request.session.id)
      if (!dapp?.isConnected) return false

      const network = mainCtrl.networks.networks.find((n) => Number(n.chainId) === Number(chainId))
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
  walletSwitchEthereumChain = async ({
    params: [chainParams],
    session: { id, origin, name }
  }: ProviderRequest) => {
    const chainId = Number(chainParams.chainId)
    const network = this.mainCtrl.networks.networks.find((n) => Number(n.chainId) === chainId)

    // should never happen, because this gets validated beforehand
    if (!network)
      throw new Error(
        'Something went wrong while switching network. Please try again later or contact Ambire support.'
      )

    const dapp = this.mainCtrl.dapps.getDapp(id)

    if (!dapp) return null

    if (dapp?.chainId !== chainId) {
      this.mainCtrl.dapps.updateDapp(id, { chainId })
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      ;(async () => {
        await this.notificationManager.create({
          title: 'Successfully switched network',
          message: `Network switched to ${network.name} for ${name || origin}.`
        })
      })()
      await this.mainCtrl.dapps.broadcastDappSessionEvent(
        'chainChanged',
        {
          chain: `0x${network.chainId.toString(16)}`,
          networkVersion: `${network.chainId}`
        },
        id
      )
    }

    return null
  }

  @metadata('ACTION_REQUEST', [
    'WalletWatchAsset',
    ({ request }: { request: ProviderRequest; mainCtrl: MainController }) => {
      const options = request.params?.options
      const tokenAddress = options?.address

      if (!tokenAddress) throw ethErrors.rpc.invalidParams('Token address is required')
      if (!isAddress(tokenAddress))
        throw ethErrors.rpc.invalidParams(`Invalid address '${tokenAddress}'.`)

      // Validate symbol if provided
      if (options?.symbol !== undefined) {
        if (typeof options.symbol !== 'string') {
          throw ethErrors.rpc.invalidParams('Invalid symbol: not a string.')
        }
        if (options.symbol.length > 11) {
          throw ethErrors.rpc.invalidParams(
            `Invalid symbol '${options.symbol}': longer than 11 characters.`
          )
        }
      }

      // Validate decimals if provided
      if (options?.decimals !== undefined) {
        // Some apps (e.g. CoinGecko) send `decimals` as a string (spec expects an integer). Workaround by parsing it.
        if (typeof options?.decimals === 'string') options.decimals = +options.decimals

        if (typeof options.decimals !== 'number' || !Number.isInteger(options.decimals)) {
          throw ethErrors.rpc.invalidParams(
            `Invalid decimals '${options.decimals}': must be 0 <= 36.`
          )
        }
        if (options.decimals < 0 || options.decimals > 36) {
          throw ethErrors.rpc.invalidParams(
            `Invalid decimals '${options.decimals}': must be 0 <= 36.`
          )
        }
      }

      // Validate image if provided
      if (options?.image !== undefined) {
        if (typeof options.image !== 'string') {
          throw ethErrors.rpc.invalidParams('Invalid image: not a string.')
        }
      }

      return false // Return false to allow request window to open (all params are valid)
    }
  ])
  walletWatchAsset = () => true

  @metadata('ACTION_REQUEST', [
    'GetEncryptionPublicKey',
    ({ request, mainCtrl }: { request: ProviderRequest; mainCtrl: MainController }) => {
      let incomingAddress
      try {
        incomingAddress = getAddress(request.params?.[0])
      } catch (e: any) {
        throw ethErrors.rpc.invalidParams(e?.shortMessage || 'invalid address')
      }

      const selectedAccount = getSelectedAccount(mainCtrl, request.session.id)
      const addressesMismatch = !selectedAccount || incomingAddress !== selectedAccount
      if (addressesMismatch)
        throw ethErrors.rpc.invalidParams(
          'Account mismatch. The encryption public key request does not match the currently selected account.'
        )

      return false // Return false to allow request window to open
    }
  ])
  ethGetEncryptionPublicKey = async ({ requestRes }: ProviderRequest) => {
    const { keyAddr, keyType } = requestRes
    // should never happen (because the UI blocks it), but just in case
    if (!keyAddr || !keyType) {
      const message = `Missing required parameters: keyAddr: ${keyAddr}, keyType: ${keyType}.`
      throw ethErrors.rpc.invalidParams(message)
    }

    const signer = await this.mainCtrl.keystore.getSigner(keyAddr, keyType)
    // should never happen (because the UI blocks it), but just in case
    if (!signer.getEncryptionPublicKey) {
      const message = `This account uses a ${keyType} key, which does not support getting encryption public key.`
      throw ethErrors.rpc.invalidParams(message)
    }

    return signer.getEncryptionPublicKey()
  }

  @metadata('ACTION_REQUEST', [
    'Decrypt',
    ({ request, mainCtrl }: { request: ProviderRequest; mainCtrl: MainController }) => {
      let incomingAddress
      try {
        incomingAddress = getAddress(request.params?.[1])
      } catch (e: any) {
        throw ethErrors.rpc.invalidParams(e?.shortMessage || 'invalid address')
      }

      const selectedAccount = getSelectedAccount(mainCtrl, request.session.id)
      const addressesMismatch = !selectedAccount || incomingAddress !== selectedAccount
      if (addressesMismatch)
        throw ethErrors.rpc.invalidParams(
          'Account mismatch. The decryption request does not match the currently selected account.'
        )

      if (!request.params?.[0] || typeof request.params?.[0] !== 'string')
        throw ethErrors.rpc.invalidParams('The encrypted message is required and must be a string')

      return false // Return false to allow request window to open
    }
  ])
  ethDecrypt = ({ requestRes }: ProviderRequest) => {
    const { keyAddr, keyType, encryptedMessage } = requestRes
    // should never happen (because the UI blocks it), but just in case
    if (!keyAddr || !keyType || !encryptedMessage) {
      const message = `Missing required parameters: keyAddr: ${keyAddr}, keyType: ${keyType}, encryptedMessage: ${encryptedMessage}.`
      throw ethErrors.rpc.invalidParams(message)
    }

    try {
      return this.mainCtrl.keystore.decryptMessage({ keyAddr, keyType, encryptedMessage })
    } catch (e) {
      const message = `Failed to decrypt message. Error details: <${e}>`
      throw ethErrors.provider.unauthorized(message)
    }
  }

  walletRequestPermissions = ({ params: permissions, session }: DappProviderRequest) => {
    const result: Web3WalletPermission[] = []

    if (permissions && 'eth_accounts' in permissions[0]) {
      const dapp = this.mainCtrl.dapps.getDapp(session.id)
      const grantedPermissionId = dapp?.grantedPermissionId || nanoid(21)
      const grantedPermissionAt = dapp?.grantedPermissionAt || Date.now()
      const account = this._internalGetAccounts(session.id)

      result.push({
        id: grantedPermissionId,
        parentCapability: 'eth_accounts',
        invoker: session.origin,
        caveats: [{ type: 'restrictReturnedAccounts', value: account }],
        date: grantedPermissionAt
      })

      // TODO: Undecided yet if we should support this `parentCapability` permission too
      // const chainIds = this.mainCtrl.networks.networks.map((n) => networkChainIdToHex(n.chainId))
      // result.push({
      //   id: grantedPermissionId,
      //   parentCapability: 'endowment:permitted-chains',
      //   invoker: session.origin,
      //   caveats: [{ type: 'restrictNetworkSwitching', value: chainIds }],
      //   date: grantedPermissionAt
      // })

      this.mainCtrl.dapps.updateDapp(session.id, { grantedPermissionId, grantedPermissionAt })
    }

    return result
  }

  /**
   * Revokes the current dapp permissions. Experimental, but supported in MetaMask. Specified by MIP-2:
   * {@link https://github.com/MetaMask/metamask-improvement-proposals/blob/main/MIPs/mip-2.md}
   */
  @metadata('SAFE', true)
  walletRevokePermissions = async ({
    params: permissions,
    session: { id }
  }: DappProviderRequest) => {
    // Per MIP-2, `params[0]` names the specific permission(s) being revoked - a call that
    // doesn't name `eth_accounts` isn't asking to disconnect the dapp. Some dapps call this
    // method defensively for unrelated permissions; without this check, any such call would
    // unconditionally disconnect the dapp instead of being a no-op, unlike MetaMask/Rabby.
    if (!permissions || !('eth_accounts' in permissions[0])) return null

    // The request can only originate from the injected channel (WC dapps don't use
    // MIP-2 revocation), so scope the disconnect to that source. If WC is also
    // connected for this dapp, it stays connected — the user has to explicitly
    // disconnect WC from Manage App.
    await this.mainCtrl.dapps.disconnectDappSource(id, 'injected')
    this.mainCtrl.dapps.updateDapp(id, {
      grantedPermissionId: undefined,
      grantedPermissionAt: undefined
    })
    return null
  }

  @metadata('SAFE', true)
  walletGetPermissions = ({ session }: DappProviderRequest) => {
    const { id, origin } = session
    const result: Web3WalletPermission[] = []
    const { grantedPermissionId, grantedPermissionAt } = this.mainCtrl.dapps.getDapp(id) || {}

    // Do not check if extension is unlocked, always return the permissions if one are granted
    const hasGrantedPermission =
      !!grantedPermissionId &&
      !!grantedPermissionAt &&
      this.mainCtrl.dapps.hasPermission(id, getRequestSource(session))
    if (hasGrantedPermission) {
      const account = this._internalGetAccounts(id)

      result.push({
        id: grantedPermissionId,
        parentCapability: 'eth_accounts',
        invoker: origin,
        caveats: [{ type: 'restrictReturnedAccounts', value: account }],
        date: grantedPermissionAt
      })

      // TODO: Undecided yet if we should support this `parentCapability` permission too
      // const chainIds = this.mainCtrl.networks.networks.map((n) => networkChainIdToHex(n.chainId))
      // result.push({
      //   id: grantedPermissionId,
      //   parentCapability: 'endowment:permitted-chains',
      //   invoker: origin,
      //   caveats: [{ type: 'restrictNetworkSwitching', value: chainIds }],
      //   date: grantedPermissionAt
      // })
    }

    return result
  }

  personalEcRecover = ({ params: [data, sig, extra = {}] }: DappProviderRequest) => {
    // TODO:
  }

  @metadata('SAFE', true)
  netListening = () => {
    return true
  }
}

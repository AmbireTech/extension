// ESM-only or React Native modules, which the CommonJS test runtime cannot load,
// and `ethRpc` does not use them
jest.mock('nanoid', () => ({ nanoid: () => 'id' }))
jest.mock('@common/config/env', () => ({ APP_VERSION: 'test' }))
jest.mock('@common/utils/links', () => ({ openInTab: jest.fn() }))

import { EthereumRpcError } from 'eth-rpc-errors'
import { Network } from 'ethers'

import { DappProviderRequest } from '@ambire-common/interfaces/dapp'
import { IMainController } from '@ambire-common/interfaces/main'
import { FetchJsonRpcProvider } from '@ambire-common/services/provider/fetchJsonRpcProvider'

import { ProviderController } from './ProviderController'

const MAINNET = Network.from(1)
const REVERT_DATA =
  '0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002645524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e63650000000000000000000000000000000000000000000000000000'

/** A `fetch` that answers every JSON-RPC payload in the request with what the test tells it to. */
const mockRpc = (answer: { status?: number; error?: object }) => {
  global.fetch = jest.fn(async (_url: any, request: any) => {
    const body = JSON.parse(request.body)
    const payloads = Array.isArray(body) ? body : [body]
    const { status = 200, error } = answer

    return {
      ok: status === 200,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: { forEach: () => {} },
      text: async () => JSON.stringify(payloads.map(({ id }) => ({ jsonrpc: '2.0', id, error })))
    }
  }) as any
}

const createProviderController = () => {
  const provider = new FetchJsonRpcProvider('https://rpc.test.ambire.com/ethereum', MAINNET, {
    staticNetwork: MAINNET
  })
  const mainCtrl = {
    keystore: { isReadyToStoreKeys: true, isUnlocked: true },
    networks: { networks: [{ chainId: 1n }] },
    providers: { providers: { '1': provider } },
    dapps: { getDapp: () => undefined, hasPermission: () => false }
  } as unknown as IMainController

  return new ProviderController(mainCtrl, {} as any)
}

const ethRpc = (method: string, params: any[]) =>
  createProviderController().ethRpc({
    method,
    params,
    session: { id: 'https://dapp.test' }
  } as unknown as DappProviderRequest)

const realFetch = global.fetch

afterEach(() => {
  global.fetch = realFetch
})

// ethers wraps the node's errors into its own, so `ethRpc` digs the node's error out of it to
// give dapps the EIP-1193 shape. These go through a real ethers provider on purpose: they are
// what catches an ethers upgrade that moves the node's error somewhere else.
describe('ProviderController.ethRpc errors', () => {
  it("forwards the node's error with the revert data of a reverted eth_call", async () => {
    const nodeError = {
      code: 3,
      message: 'execution reverted: ERC20: transfer amount exceeds balance',
      data: REVERT_DATA
    }
    mockRpc({ error: nodeError })

    const error = await ethRpc('eth_call', [
      { to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', data: '0xa9059cbb' },
      'latest'
    ]).catch((e) => e)

    expect(error).toBeInstanceOf(EthereumRpcError)
    expect(error.serialize()).toMatchObject(nodeError)
  })

  it("forwards the node's error of a method ethers has no special handling for", async () => {
    const nodeError = { code: -32000, message: 'header not found' }
    mockRpc({ error: nodeError })

    const error = await ethRpc('eth_getBlockByNumber', ['latest', false]).catch((e) => e)

    expect(error).toBeInstanceOf(EthereumRpcError)
    expect(error.serialize()).toMatchObject(nodeError)
    expect(error.serialize().data).toBeUndefined()
  })

  it('rethrows an error that does not come from the node as it is', async () => {
    mockRpc({ status: 500 })

    const error = await ethRpc('eth_blockNumber', []).catch((e) => e)

    expect(error).not.toBeInstanceOf(EthereumRpcError)
    expect(error.code).toBe('SERVER_ERROR')
  })
})

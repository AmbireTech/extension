// What dapps are told about a PQ1 account: that it is a smart-contract
// wallet (`eth_getCode`) that runs batches atomically
// (`wallet_getCapabilities`), although Ambire imports it as a plain address.

import type { JsonRpcProvider } from 'ethers'

import type { Key } from '@ambire-common/interfaces/keystore'
import type { Network } from '@ambire-common/interfaces/network'

import {
  buildPq1Capabilities,
  isPq1AccountCodeQuery,
  isPq1Key,
  resolvePq1AccountCode
} from './pq1DappProvider'

const PQ1_ACCOUNT = '0x00000000000000000000000000000000000AbC25'
const OTHER_ACCOUNT = '0x1111111111111111111111111111111111111111'
const DEPLOYED_CODE = '0x6080604052'
const UNDEPLOYED_STUB = '0xfe'

/** A provider whose `send` answers with `answer` and records its calls. */
function fakeProvider(answer: () => Promise<string>) {
  const send = jest.fn<Promise<string>, [method: string, params: unknown[]]>(answer)
  return { provider: { send } as unknown as JsonRpcProvider, send }
}

describe('isPq1Key', () => {
  const keys = [
    { type: 'internal', addr: OTHER_ACCOUNT },
    { type: 'pq1', addr: PQ1_ACCOUNT }
  ] as Key[]

  it('matches a PQ1 key whatever the address case', () => {
    expect(isPq1Key(keys, PQ1_ACCOUNT.toLowerCase())).toBe(true)
  })

  it('ignores keys of other types', () => {
    expect(isPq1Key(keys, OTHER_ACCOUNT)).toBe(false)
  })
})

describe('isPq1AccountCodeQuery', () => {
  const keys = [
    { type: 'internal', addr: OTHER_ACCOUNT },
    { type: 'pq1', addr: PQ1_ACCOUNT }
  ] as Key[]

  it('answers for a PQ1 account the dapp is connected to, on a PQ1 chain', () => {
    expect(isPq1AccountCodeQuery(keys, [PQ1_ACCOUNT], 8453n, PQ1_ACCOUNT.toLowerCase())).toBe(true)
  })

  it("leaves accounts the dapp isn't connected to alone, so it learns nothing about them", () => {
    expect(isPq1AccountCodeQuery(keys, [], 8453n, PQ1_ACCOUNT)).toBe(false)
    expect(isPq1AccountCodeQuery(keys, [OTHER_ACCOUNT], 8453n, PQ1_ACCOUNT)).toBe(false)
  })

  it('leaves chains PQ1 wallets are not deployed on, and other accounts, alone', () => {
    expect(isPq1AccountCodeQuery(keys, [PQ1_ACCOUNT], 137n, PQ1_ACCOUNT)).toBe(false)
    expect(isPq1AccountCodeQuery(keys, [OTHER_ACCOUNT], 8453n, OTHER_ACCOUNT)).toBe(false)
  })
})

describe('resolvePq1AccountCode', () => {
  it("answers with a deployed wallet's real code", async () => {
    const { provider } = fakeProvider(async () => DEPLOYED_CODE)
    expect(await resolvePq1AccountCode(provider, [PQ1_ACCOUNT, 'latest'])).toBe(DEPLOYED_CODE)
  })

  it('answers with a non-empty stub before the wallet is deployed', async () => {
    const { provider } = fakeProvider(async () => '0x')
    expect(await resolvePq1AccountCode(provider, [PQ1_ACCOUNT])).toBe(UNDEPLOYED_STUB)
    expect(await resolvePq1AccountCode(provider, [PQ1_ACCOUNT, 'pending'])).toBe(UNDEPLOYED_STUB)
  })

  it('passes a query at a past block through unchanged', async () => {
    const { provider, send } = fakeProvider(async () => '0x')
    expect(await resolvePq1AccountCode(provider, [PQ1_ACCOUNT, '0x10'])).toBe('0x')
    expect(send).toHaveBeenCalledWith('eth_getCode', [PQ1_ACCOUNT, '0x10'])
  })

  it('answers with the stub when the network request fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const { provider } = fakeProvider(async () => {
      throw new Error('network down')
    })
    expect(await resolvePq1AccountCode(provider, [PQ1_ACCOUNT, 'latest'])).toBe(UNDEPLOYED_STUB)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('buildPq1Capabilities', () => {
  it('offers atomic batches only on the chains PQ1 wallets can be deployed on', () => {
    const networks = [{ chainId: 8453n }, { chainId: 10n }] as Network[]

    expect(buildPq1Capabilities(networks)).toEqual({
      '0x2105': {
        atomicBatch: { supported: true },
        auxiliaryFunds: { supported: false },
        paymasterService: { supported: false },
        atomic: { status: 'supported' }
      },
      '0xa': {
        atomicBatch: { supported: false },
        auxiliaryFunds: { supported: false },
        paymasterService: { supported: false },
        atomic: { status: 'unsupported' }
      }
    })
  })
})

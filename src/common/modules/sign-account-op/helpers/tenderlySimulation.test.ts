jest.mock('@ambire-common/../contracts/compiled/AmbireAccount.json', () => ({ abi: [] }), {
  virtual: true
})
jest.mock('@ambire-common/../contracts/compiled/AmbireFactory.json', () => ({ abi: [] }), {
  virtual: true
})
jest.mock('@ambire-common/consts/deploy', () => ({ DEPLOYLESS_SIMULATION_FROM: '0x1' }), {
  virtual: true
})
jest.mock('@ambire-common/consts/safe', () => ({ execTransactionAbi: [] }), {
  virtual: true
})
jest.mock('@ambire-common/libs/account/account', () => ({ getSpoof: jest.fn() }), {
  virtual: true
})
jest.mock('@ambire-common/libs/accountOp/accountOp', () => ({ getSignableCalls: jest.fn() }), {
  virtual: true
})
jest.mock('@ambire-common/libs/safe/helpers', () => ({ getSafeTxn: jest.fn() }), {
  virtual: true
})

import { getTenderlySimulationLink } from './tenderlySimulation'

const decodeTenderlyDraft = (link: string) => {
  const url = new URL(link)
  const draft = url.searchParams.get('draft')
  expect(draft).toBeTruthy()

  const paddingLength = (4 - (draft!.length % 4)) % 4
  const paddedDraft = `${draft}${'='.repeat(paddingLength)}`

  return {
    draft: JSON.parse(Buffer.from(paddedDraft, 'base64').toString()),
    url
  }
}

describe('getTenderlySimulationLink', () => {
  test('builds EOA simulations with a Tenderly draft instead of legacy query params', () => {
    const contractAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    const from = '0x1111111111111111111111111111111111111111'
    const rawFunctionInput = '0xdeadbeef'
    const value = 123n

    const link = getTenderlySimulationLink({
      signAccountOpState: {
        account: {
          creation: null
        },
        accountOp: {
          accountAddr: from,
          calls: [
            {
              to: contractAddress,
              data: rawFunctionInput,
              value
            }
          ],
          chainId: 1n
        }
      } as any,
      state: {
        isEOA: true,
        isSmarterEoa: false
      } as any
    })

    expect(link).toBeTruthy()

    const { draft, url } = decodeTenderlyDraft(link!)

    expect(url.searchParams.get('network')).toBeNull()
    expect(url.searchParams.get('contractAddress')).toBeNull()
    expect(draft.network.id).toBe('1')
    expect(draft.row.from).toBe(from)
    expect(draft.row.contractAddress).toBe(contractAddress)
    expect(draft.row.rawFunctionInput).toBe(rawFunctionInput)
    expect(draft.row.value).toBe(value.toString())
  })
})

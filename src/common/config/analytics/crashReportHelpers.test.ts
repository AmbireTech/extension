import {
  createCrashReportAccountTagsSync,
  getCrashReportAccountTags,
  getReportableAction
} from './crashReportHelpers'

jest.mock('@common/config/env', () => ({ isTesting: false }))

describe('getReportableAction', () => {
  it('strips args from method actions, keeping only ctrlName and method', () => {
    const action = {
      type: 'method',
      params: {
        ctrlName: 'KeystoreController',
        method: 'sendPasswordDecryptedPrivateKeyToUi',
        args: ['SuperSecretPassword123!', '0xkey', '0xsalt', '0xiv', ['0xaddr']]
      }
    } as any

    const result = getReportableAction(action)

    expect(result).toEqual({
      type: 'method',
      params: { ctrlName: 'KeystoreController', method: 'sendPasswordDecryptedPrivateKeyToUi' }
    })
    expect(JSON.stringify(result)).not.toContain('SuperSecretPassword123!')
  })

  it('does not mutate the original action', () => {
    const action = {
      type: 'method',
      params: { ctrlName: 'KeystoreController', method: 'someMethod', args: ['secret'] }
    } as any

    getReportableAction(action)

    expect(action.params.args).toEqual(['secret'])
  })

  it('strips args even when args is empty', () => {
    const action = {
      type: 'method',
      params: { ctrlName: 'KeystoreController', method: 'someMethod', args: [] }
    } as any

    expect(getReportableAction(action)).toEqual({
      type: 'method',
      params: { ctrlName: 'KeystoreController', method: 'someMethod' }
    })
  })

  const nonMethodActions = [
    { type: 'HANDSHAKE' },
    { type: 'UPDATE_PORT_URL', params: { url: 'https://ambire.com' } },
    { type: 'WINDOW_REMOVED', params: { id: 5 } },
    {
      type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_FROM_SAVED_SEED_PHRASE',
      params: { id: 'seed-id' }
    }
  ]

  nonMethodActions.forEach((action) => {
    it(`passes non-method actions through unchanged: ${action.type}`, () => {
      expect(getReportableAction(action as any)).toBe(action)
    })
  })
})

describe('getCrashReportAccountTags', () => {
  const EOA_ADDR = '0xEoa'
  const buildAccount = (overrides: any = {}): any => ({
    addr: EOA_ADDR,
    associatedKeys: [EOA_ADDR],
    ...overrides
  })
  const buildInput = (overrides: any = {}) => ({
    selectedAccount: buildAccount(),
    accountStates: {},
    keys: [{ addr: EOA_ADDR, type: 'internal' }] as any,
    accounts: [buildAccount()],
    ...overrides
  })

  it('gives no tags when no account is selected', () => {
    expect(getCrashReportAccountTags(buildInput({ selectedAccount: null }))).toEqual({})
  })

  it('tells a 7702 account by any chain with isSmarterEoa, not by the first chain', () => {
    const accountStates = { [EOA_ADDR]: { 1: { isSmarterEoa: false }, 10: { isSmarterEoa: true } } }

    expect(getCrashReportAccountTags(buildInput({ accountStates })).accountType).toBe('7702')
  })

  it('reports a smart account as smart even when its state says smarter EOA', () => {
    const selectedAccount = buildAccount({ creation: {} })
    const accountStates = { [EOA_ADDR]: { 1: { isSmarterEoa: true } } }

    expect(
      getCrashReportAccountTags(buildInput({ selectedAccount, accountStates })).accountType
    ).toBe('smart')
  })

  it('tells key types apart, with view-only as none', () => {
    const hardwareKeys = [{ addr: EOA_ADDR, type: 'ledger' }]
    const mixedKeys = [...hardwareKeys, { addr: EOA_ADDR, type: 'internal' }]
    const otherAccountKeys = [{ addr: '0xOther', type: 'internal' }]

    expect(getCrashReportAccountTags(buildInput({ keys: hardwareKeys })).keyType).toBe('hardware')
    expect(getCrashReportAccountTags(buildInput({ keys: mixedKeys })).keyType).toBe('internal')
    expect(getCrashReportAccountTags(buildInput({ keys: otherAccountKeys })).keyType).toBe('none')
  })

  it.each([
    [1, '1'],
    [2, '2-5'],
    [5, '2-5'],
    [6, '6+']
  ])('buckets %i accounts as %s', (count, bucket) => {
    const accounts = Array.from({ length: count }, () => buildAccount())

    expect(getCrashReportAccountTags(buildInput({ accounts })).accountCount).toBe(bucket)
  })
})

describe('createCrashReportAccountTagsSync', () => {
  it('sets only the changed tags and clears the ones that went away', () => {
    const setTag = jest.fn()
    const sync = createCrashReportAccountTagsSync(setTag)

    sync({ accountType: 'eoa', keyType: 'internal', accountCount: '1' })
    setTag.mockClear()

    sync({ accountType: 'eoa', keyType: 'none', accountCount: '1' })
    expect(setTag.mock.calls).toEqual([['keyType', 'none']])

    setTag.mockClear()
    sync({})
    expect(setTag.mock.calls).toEqual([
      ['accountType', undefined],
      ['keyType', undefined],
      ['accountCount', undefined]
    ])
  })
})

import type { Account } from '@ambire-common/interfaces/account'

import { buildPQ1AccountsToImport } from './importAccounts'

const existingAccounts = [{ addr: '0x0000000000000000000000000000000000000001' }] as Account[]

describe('buildPQ1AccountsToImport', () => {
  const { accounts, keys } = buildPQ1AccountsToImport(
    [
      { accountIndex: 0, addr: '0x00000000000000000000000000000000000abc25' },
      { accountIndex: 3, addr: '0x00000000000000000000000000000000000abc26' }
    ],
    'c972799008cf',
    existingAccounts
  )

  it('makes each account a plain address controlled by its own key', () => {
    const [first, second] = [
      '0x00000000000000000000000000000000000AbC25',
      '0x00000000000000000000000000000000000ABC26'
    ]
    expect(accounts.map((a) => [a.addr, a.associatedKeys, a.creation])).toEqual([
      [first, [first], null],
      [second, [second], null]
    ])
  })

  it('names accounts and keys like the account picker does', () => {
    expect(accounts.map((a) => a.preferences.label)).toEqual(['Account 2', 'Account 3'])
    expect(keys.map((k) => k.label)).toEqual(['PQ1 Key 1', 'PQ1 Key 1'])
  })

  it('stores the account number on the device as the key index', () => {
    expect(keys.map((k) => [k.type, k.meta.index, k.meta.deviceId])).toEqual([
      ['pq1', 0, 'c972799008cf'],
      ['pq1', 3, 'c972799008cf']
    ])
  })

  it('keeps the name of an account already in the wallet (e.g. added as view-only)', () => {
    const viewOnlyAddr = '0x00000000000000000000000000000000000AbC25'
    const viewOnlyPreferences = { label: 'My PQ1 savings', pfp: viewOnlyAddr }
    const { accounts: reimported, keys: reimportedKeys } = buildPQ1AccountsToImport(
      [{ accountIndex: 0, addr: viewOnlyAddr.toLowerCase() }],
      'c972799008cf',
      [{ addr: viewOnlyAddr, preferences: viewOnlyPreferences }] as Account[]
    )

    expect(reimported.map((a) => a.preferences)).toEqual([viewOnlyPreferences])
    // The key is added either way: that is what turns the view-only account into a signing one
    expect(reimportedKeys.map((k) => [k.addr, k.type])).toEqual([[viewOnlyAddr, 'pq1']])
  })
})

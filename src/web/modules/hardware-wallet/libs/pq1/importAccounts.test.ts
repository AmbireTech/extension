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
})

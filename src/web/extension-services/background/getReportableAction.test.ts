import { getReportableAction } from './getReportableAction'

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

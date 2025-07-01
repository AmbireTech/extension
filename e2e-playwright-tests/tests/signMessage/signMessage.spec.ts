import { baParams } from 'constants/env'
import { test } from 'fixtures/pageObjects'

test.describe.parallel('signMessage', () => {
  test.beforeEach(async ({ signMessagePage }) => {
    await signMessagePage.init(baParams)
  })

  test('should sign plain message', async ({ signMessagePage }) => {
    const message = 'Hello, Ambire!'
    await signMessagePage.signMessage(message, 'plain')
  })

  test('should sign hex message', async ({ signMessagePage }) => {
    // "Hello, Ambire!" as hex
    const message = '0x48656c6c6f2c20416d6269726521'
    await signMessagePage.signMessage(message, 'hex')
  })

  test('should sign typed message', async ({ signMessagePage }) => {
    const message = {
      domain: {
        name: 'Ambire Wallet News',
        chainId: 1
      },
      types: {
        article: [
          {
            name: 'title',
            type: 'string'
          },
          {
            name: 'description',
            type: 'string'
          },
          {
            name: 'publisher',
            type: 'address'
          },
          {
            name: 'rating',
            type: 'uint256'
          }
        ]
      },
      primaryType: 'article',
      message: {
        title: 'Example of eip-712 typed data message',
        description:
          'Tip: When chainId is specified in the domain, you should select the appropriate network in your wallet',
        publisher: '0x942f9CE5D9a33a82F88D233AEb3292E680230348',
        rating: '5'
      }
    }

    await signMessagePage.signMessage(JSON.stringify(message), 'typed')
  })
})

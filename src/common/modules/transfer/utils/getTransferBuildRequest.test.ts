import { TokenResult } from '@ambire-common/libs/portfolio'

import getTransferBuildRequest from './getTransferBuildRequest'

const RECIPIENT = '0xa07D75aacEFd11b425AF7181958F0F85c312f143'
const NFT = {
  address: '0x59468516a8259058baD1cA5F8f4BFF190d30E066',
  chainId: 1n,
  tokenId: 42n,
  collectionName: 'Test Collection'
}
const TOKEN: TokenResult = {
  address: '0x0000000000000000000000000000000000000000',
  amount: 1n,
  symbol: 'ETH',
  name: 'Ether',
  chainId: 1n,
  decimals: 18,
  priceIn: [],
  marketDataIn: [],
  flags: { onGasTank: false, rewardsType: null, canTopUpGasTank: true, isFeeToken: true }
}

const baseParams = {
  amount: '0.5',
  amountInFiat: 100n,
  recipientAddress: RECIPIENT,
  recipientDomain: 'recipient.eth',
  executionType: 'queue' as const
}

describe('getTransferBuildRequest', () => {
  test('builds an NFT transfer request when an NFT is selected', () => {
    expect(
      getTransferBuildRequest({ ...baseParams, selectedNft: NFT, selectedToken: null })
    ).toEqual({
      type: 'nftTransferRequest',
      params: {
        nft: NFT,
        recipientAddress: RECIPIENT,
        recipientDomain: 'recipient.eth',
        executionType: 'queue'
      }
    })
  })

  test('sends the NFT and never the token if both are somehow set', () => {
    const request = getTransferBuildRequest({
      ...baseParams,
      selectedNft: NFT,
      selectedToken: TOKEN
    })

    expect(request?.type).toBe('nftTransferRequest')
  })

  test('builds a token transfer request when a token is selected', () => {
    expect(
      getTransferBuildRequest({ ...baseParams, selectedNft: null, selectedToken: TOKEN })
    ).toEqual({
      type: 'transferRequest',
      params: {
        amount: '0.5',
        amountInFiat: 100n,
        selectedToken: TOKEN,
        recipientAddress: RECIPIENT,
        recipientDomain: 'recipient.eth',
        executionType: 'queue'
      }
    })
  })

  test('returns null when there is nothing to send', () => {
    expect(
      getTransferBuildRequest({ ...baseParams, selectedNft: null, selectedToken: null })
    ).toBeNull()
  })
})

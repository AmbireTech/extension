import type { BuildRequest } from '@ambire-common/interfaces/requests'
import type { TransferNft } from '@ambire-common/interfaces/transfer'
import type { RequestExecutionType } from '@ambire-common/interfaces/userRequest'
import type { TokenResult } from '@ambire-common/libs/portfolio'

type Params = {
  selectedNft: TransferNft | null
  selectedToken: TokenResult | null
  amount: string
  /** Used only for top up calculations */
  amountInFiat: bigint
  recipientAddress: string
  recipientDomain: string | undefined
  executionType: RequestExecutionType
  /** Seed id of the Privacy Pools account to send a token to, which has no address. */
  privacyPoolsSeedId?: string
}

/**
 * The `RequestsController.build` request for whatever the transfer form sends - the selected
 * NFT or the selected token. Returns `null` when the form has nothing to send.
 */
const getTransferBuildRequest = ({
  selectedNft,
  selectedToken,
  amount,
  amountInFiat,
  recipientAddress,
  recipientDomain,
  executionType,
  privacyPoolsSeedId
}: Params): BuildRequest | null => {
  if (selectedNft) {
    return {
      type: 'nftTransferRequest',
      params: { nft: selectedNft, recipientAddress, recipientDomain, executionType }
    }
  }

  if (!selectedToken) return null

  return {
    type: 'transferRequest',
    params: {
      amount,
      amountInFiat,
      selectedToken,
      recipientAddress,
      executionType,
      recipientDomain,
      privacyPoolsSeedId
    }
  }
}

export default getTransferBuildRequest

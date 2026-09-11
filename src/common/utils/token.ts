import { SwapAndBridgeToToken } from '@ambire-common/interfaces/swapAndBridge'
import { TokenResult } from '@ambire-common/libs/portfolio'

const getTokenId = (
  token: Pick<SwapAndBridgeToToken | TokenResult, 'address' | 'chainId'> &
    Partial<Pick<TokenResult, 'flags'>>
) => {
  let id = `${token.address}.${token.chainId}`

  // If it's a SwapAndBridgeToToken (no flags), just return address + chainId
  if (!('flags' in token)) return id

  const { onGasTank, rewardsType } = token.flags as TokenResult['flags']

  if (onGasTank) id += '.onGasTank'
  if (rewardsType) id += `.rewardsType=${rewardsType}`

  return id
}

export { getTokenId }

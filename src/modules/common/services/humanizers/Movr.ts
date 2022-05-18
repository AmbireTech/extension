import networks from 'ambire-common/src/constants/networks'
import { Interface } from 'ethers/lib/utils'

import { abis } from '@modules/common/constants/humanizerInfo.json'
import { formatNativeTokenAddress, token } from '@modules/common/services/humanReadableTransactions'

const MovrAnyswapInterface = new Interface(abis.MovrAnyswap)
const MovrRouterInterface = new Interface(abis.MovrRouter)

const getNetwork = (chainId) => networks.find((n) => n.chainId === Number(chainId)).name

const MovrMapping = {
  [MovrAnyswapInterface.getSighash('outboundTransferTo')]: (txn, network) => {
    const { middlewareInputToken, amount, tokenToBridge, toChainId } =
      MovrAnyswapInterface.parseTransaction(txn).args[0]
    return [
      `Transfer ${token(middlewareInputToken, amount)} to ${getNetwork(toChainId)} for ${token(
        tokenToBridge
      )}`
    ]
  },
  [MovrRouterInterface.getSighash('outboundTransferTo')]: (txn, network) => {
    const { middlewareRequest, amount, bridgeRequest, toChainId } =
      MovrRouterInterface.parseTransaction(txn).args[0]
    const { inputToken } = middlewareRequest
    const { inputToken: outputToken } = bridgeRequest
    return [
      `Transfer ${token(formatNativeTokenAddress(inputToken), amount)} to ${getNetwork(
        toChainId
      )} for ${token(formatNativeTokenAddress(outputToken))}`
    ]
  }
}
export default MovrMapping

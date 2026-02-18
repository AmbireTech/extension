import { ERROR_MESSAGES } from '@legends/constants/errors/messages'

import useAccountContext from '../useAccountContext'
import useProviderContext from '../useProviderContext'
import useToast from '../useToast'

const useSwitchNetwork = () => {
  const { provider } = useProviderContext()
  const { chainId } = useAccountContext()
  const { addToast } = useToast()

  const switchNetwork = async (newChainId: number) => {
    if (!provider) return

    const isAlreadyConnected = Number(chainId) === newChainId
    // Request a chain change to base and a sign message to associate the EOA address
    try {
      if (isAlreadyConnected) return
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${newChainId.toString(16)}` }]
      })
    } catch {
      addToast(ERROR_MESSAGES.networkSwitchFailed, { type: 'error' })
    }
  }

  return switchNetwork
}

export default useSwitchNetwork

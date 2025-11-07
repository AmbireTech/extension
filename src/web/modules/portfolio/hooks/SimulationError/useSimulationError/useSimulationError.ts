import { useMemo } from 'react'

import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

interface Props {
  chainId?: bigint
}
const useSimulationError = ({ chainId }: Props) => {
  const { portfolio } = useSelectedAccountControllerState()
  const { networks } = useNetworksControllerState()

  const network = useMemo(() => {
    if (!chainId) return

    return networks.find((n) => n.chainId === BigInt(chainId))
  }, [networks, chainId])

  const portfolioState = useMemo(() => {
    if (!network || !portfolio.portfolioState) return

    return portfolio.portfolioState[network.chainId.toString()]
  }, [network, portfolio.portfolioState])

  const simulationError = useMemo(() => {
    if (!portfolioState || portfolioState.isLoading) return

    return portfolioState.criticalError?.simulationErrorMsg
  }, [portfolioState])

  return {
    simulationError
  }
}

export default useSimulationError

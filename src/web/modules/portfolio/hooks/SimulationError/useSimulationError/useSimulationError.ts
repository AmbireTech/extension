import { useMemo } from 'react'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

interface Props {
  chainId?: bigint | number | null
}
const useSimulationError = ({ chainId }: Props) => {
  const { portfolio } = useSelectedAccountControllerState()
  const { networks } = useNetworksControllerState()

  const network = useMemo(() => {
    if (!chainId) return

    return networks.find((n) => n.chainId === BigInt(chainId))
  }, [networks, chainId])

  const portfolioPending = useMemo(() => {
    if (!network || !portfolio.pending) return

    return portfolio.pending[network.chainId.toString()]
  }, [network, portfolio.pending])

  const simulationError = useMemo(() => {
    if (!portfolioPending || portfolioPending.isLoading) return

    return portfolioPending.criticalError?.simulationErrorMsg
  }, [portfolioPending])

  return {
    simulationError
  }
}

export default useSimulationError

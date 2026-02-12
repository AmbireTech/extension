import { useMemo } from 'react'

import useController from '@common/hooks/useController'

interface Props {
  chainId?: bigint | number | null
}
const useSimulationError = ({ chainId }: Props) => {
  const {
    state: { portfolio }
  } = useController('SelectedAccountController')
  const { networks } = useController('NetworksController').state

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

import { useMemo } from 'react'

import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  chainId?: bigint | number | null
}
const selectPortfolio = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio
const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

const useSimulationError = ({ chainId }: Props) => {
  const { state: portfolio } = useController('SelectedAccountController', selectPortfolio)
  const { state: networks } = useController('NetworksController', selectNetworks)

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

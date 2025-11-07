import { useContext } from 'react'

import { ContractNamesControllerStateContext } from '@web/contexts/contractNamesControllerStateContext'

export default function useContractNamesControllerState() {
  const context = useContext(ContractNamesControllerStateContext)

  if (!context) {
    throw new Error(
      'useContractNamesControllerState must be used within a ContractNamesControllerStateContext'
    )
  }

  return context
}

import { useContext } from 'react'

import { ContractNamesContext } from '@common/contexts/contractNamesContext'

export default function useContractNamesContext() {
  const context = useContext(ContractNamesContext)

  if (!context) {
    throw new Error('useContractNamesContext must be used within a ContractNamesContext')
  }

  return context
}

import React, { createContext, useEffect, useMemo, useState } from 'react'

import { ContractNamesController } from '@ambire-common/controllers/contractNames/contractNames'
import { IContractNamesController } from '@ambire-common/interfaces/contractNames'

const ContractNamesContext = createContext<{
  state: IContractNamesController
  contractNamesCtrl: IContractNamesController
}>({
  state: {} as IContractNamesController,
  contractNamesCtrl: {} as IContractNamesController
})
const contractNamesCtrl = new ContractNamesController({
  fetch: fetch.bind(window) as any,
  debounceTime: 50
})

const ContractNamesContextProvider: React.FC<any> = ({ children }) => {
  const [state, setState] = useState<IContractNamesController>(contractNamesCtrl)

  useEffect(() => {
    if (!contractNamesCtrl) return

    contractNamesCtrl.onUpdate(() => {
      setState(contractNamesCtrl.toJSON())
    })
  }, [])

  const value = useMemo(
    () => ({
      state,
      contractNamesCtrl
    }),
    [state]
  )

  return <ContractNamesContext.Provider value={value}>{children}</ContractNamesContext.Provider>
}

export { ContractNamesContext, ContractNamesContextProvider }

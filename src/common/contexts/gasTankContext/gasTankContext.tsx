import { GasTankEntryType, UseGasTankReturnType } from 'ambire-common/src/hooks/useGasTank'
import React, { createContext, useEffect, useMemo, useState } from 'react'

import useAccounts from '@common/hooks/useAccounts'
import useNetwork from '@common/hooks/useNetwork'

interface GasTankContextDataType extends UseGasTankReturnType {
  currentAccGasTankState: GasTankEntryType
}

const DEFAULT_IS_ENABLED = true

const GasTankContext = createContext<GasTankContextDataType>({
  gasTankState: [],
  currentAccGasTankState: { account: '', isEnabled: DEFAULT_IS_ENABLED },
  setGasTankState: () => {}
})

const GasTankProvider: React.FC = ({ children }) => {
  const { selectedAcc } = useAccounts()
  const { network } = useNetwork()

  // Since v3.11.0, do not take the gas tank state from the storage, it needs to act as
  // "always enabled", but keep it in the state, in case changes are needed in the future.
  // const { gasTankState, setGasTankState } = useGasTank({
  //   selectedAcc,
  //   useStorage
  // })
  const [gasTankState, setGasTankState] = useState<GasTankEntryType[]>([
    {
      account: selectedAcc,
      isEnabled: DEFAULT_IS_ENABLED
    }
  ])

  useEffect(() => {
    // Gas Tank: Adding default state when the account is changed or created
    if (gasTankState.length && !gasTankState.find((i) => i.account === selectedAcc)) {
      setGasTankState([...gasTankState, { account: selectedAcc, isEnabled: DEFAULT_IS_ENABLED }])
    }
  }, [gasTankState, selectedAcc, setGasTankState, network?.isGasTankAvailable])

  const currentAccGasTankState = useMemo(() => {
    if (gasTankState.length && network?.isGasTankAvailable) {
      return (
        gasTankState.find((i) => i.account === selectedAcc) || {
          account: selectedAcc,
          isEnabled: DEFAULT_IS_ENABLED
        }
      )
    }
    return { account: selectedAcc, isEnabled: DEFAULT_IS_ENABLED }
  }, [gasTankState, selectedAcc, network?.isGasTankAvailable])

  return (
    <GasTankContext.Provider
      value={useMemo(
        () => ({
          gasTankState,
          currentAccGasTankState,
          setGasTankState
        }),
        [gasTankState, currentAccGasTankState, setGasTankState]
      )}
    >
      {children}
    </GasTankContext.Provider>
  )
}

export { GasTankContext, GasTankProvider }

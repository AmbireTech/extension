import React, { createContext, useEffect, useMemo, useState } from 'react'

import { networks } from '@ambire-common/consts/networks'
import { DomainsController } from '@ambire-common/controllers/domains/domains'
import { IDomainsController } from '@ambire-common/interfaces/domains'
import { getRpcProvider } from '@ambire-common/services/provider'

const DomainsContext = createContext<{
  state: IDomainsController
  domainsCtrl: IDomainsController
}>({
  state: {} as IDomainsController,
  domainsCtrl: {} as IDomainsController
})

const ethereum = networks.find(({ chainId }) => chainId === 1n)

// Init only ethereum as it's the only provider needed for ENS resolution
// If we add other services (like UD or lens) we would need to init their
// providers here as well
const providers = {
  '1': getRpcProvider(ethereum?.rpcUrls || [], 1n, ethereum?.selectedRpcUrl)
}

const domainsCtrl = new DomainsController({ providers })

const DomainsContextProvider: React.FC<any> = ({ children }) => {
  const [state, setState] = useState<IDomainsController>(domainsCtrl)

  useEffect(() => {
    if (!domainsCtrl) return

    domainsCtrl.onUpdate(() => {
      setState(domainsCtrl.toJSON())
    })
  }, [])

  const value = useMemo(
    () => ({
      state,
      domainsCtrl
    }),
    [state]
  )

  return <DomainsContext.Provider value={value}>{children}</DomainsContext.Provider>
}

export { DomainsContext, DomainsContextProvider }

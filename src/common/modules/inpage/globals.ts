import { EthereumProvider } from '@common/modules/inpage/EthereumProvider'

declare global {
  const globalIsAmbireNext: boolean

  interface Window {
    ethereum: EthereumProvider
    web3: any
    ambire: EthereumProvider
    ambireNext: EthereumProvider
    __ambire_handleEvent?: (event: string, data: any) => void
  }
}

export {}

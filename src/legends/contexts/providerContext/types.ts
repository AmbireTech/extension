import { EthereumProvider } from '@web/extension-services/inpage/EthereumProvider'

type WalletType = 'ambire' | 'ambire-next'

type EIP6963ProviderInfo = {
  uuid: string
  name: string
  icon: string
  rdns: string
}

type EIP6963AnnounceProviderEvent = {
  detail: EIP6963ProviderDetails
}

type EIP6963ProviderDetails = {
  info: EIP6963ProviderInfo
  provider: EthereumProvider
}

type Providers = Record<WalletType, EIP6963ProviderDetails>

export type {
  WalletType,
  EIP6963ProviderInfo,
  EIP6963AnnounceProviderEvent,
  EIP6963ProviderDetails,
  Providers
}

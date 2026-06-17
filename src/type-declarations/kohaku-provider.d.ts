declare module '@kohaku-eth/provider/helios' {
  import type { Config as HeliosConfig, HeliosProvider, NetworkKind } from '@a16z/helios'
  import type { EthereumProvider } from '@kohaku-eth/provider'

  export function helios(
    config: HeliosConfig,
    kind: NetworkKind,
    bypassLogs?: boolean
  ): Promise<EthereumProvider<HeliosProvider>>
}

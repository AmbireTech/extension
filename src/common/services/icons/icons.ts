import { coingeckoNets } from 'ambire-common/src/constants/networks'

export function getTokenIcon(_networkId = '', _address = '') {
  const address = _address.toLowerCase()
  const coingeckoPlatformId = coingeckoNets[_networkId]

  return `https://cena.ambire.com/iconProxy/${coingeckoPlatformId}/${address}`
}

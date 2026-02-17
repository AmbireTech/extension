import { ZeroAddress } from 'ethers'

export const getHardcodedCitreaIcons = (address: string) => {
  if (address === ZeroAddress || address === '0x3100000000000000000000000000000000000006')
    return 'https://velcro.ambire.com/public/networks/cBTC.png'
  if (address === '0x8D82c4E3c936C7B5724A382a9c5a4E6Eb7aB6d5D'.toLowerCase())
    return 'https://coin-images.coingecko.com/coins/images/71615/standard/ctusd-logo.jpg'
  if (address === '0xE045e6c36cF77FAA2CfB54466D71A3aEF7bbE839'.toLowerCase())
    return 'https://coin-images.coingecko.com/coins/images/6319/standard/USDC.png'
  if (address === '0xDF240DC08B0FdaD1d93b74d5048871232f6BEA3d'.toLowerCase())
    return 'https://coin-images.coingecko.com/coins/images/39529/standard/WBTCLOGO.png'
  if (address === '0x9f3096Bac87e7F03DC09b0B416eB0DF837304dc4'.toLowerCase())
    return 'https://coin-images.coingecko.com/coins/images/325/standard/Tether.png'

  return null
}

type Token = {
  address: string
  // It's originally a bigint, but when used in a DOM selector, it's converted to a string.
  // For testing purposes, it's easier to keep it as a string.
  chainId: string
  chainName: string
  symbol: string
}

export default Token

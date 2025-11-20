import Token from './token'

type Threshold = [Token | 'gas-token', number]

export type ThresholdError = {
  tokenName: string
  chainName: string
  balance: number
  minBalance: number
}

export default Threshold

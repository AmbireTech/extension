import { GestureResponderEvent } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'

type Props = {
  account: Account
  onSign?: (signingKeyAddr: Key['addr'], _chosenSigningKeyType: Key['type']) => void
  isSignLoading: boolean
  signingKeyAddr: string | null
  chainId: string
  signed: string[]
  importedKeys: Key[]
  threshold: number
  onReject: (event: GestureResponderEvent) => void
  onSignLater: () => void
}

declare const SafeFooter: React.FC<Props>
export default SafeFooter

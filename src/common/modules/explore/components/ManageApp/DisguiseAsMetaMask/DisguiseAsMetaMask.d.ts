import { FC } from 'react'

import { Dapp } from '@ambire-common/interfaces/dapp'

export interface DisguiseAsMetaMaskProps {
  dapp: Dapp
  /** Runs after the preference is persisted. Used to close the menu and reload the app. */
  onToggled: () => void
}

declare const DisguiseAsMetaMask: FC<DisguiseAsMetaMaskProps>

export default DisguiseAsMetaMask

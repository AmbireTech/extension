import React from 'react'
import { SvgProps } from 'react-native-svg'

import { NfcWalletType } from '@ambire-common/interfaces/keystore'
import KeycardIcon from '@common/assets/svg/KeycardIcon'

/**
 * The icon of every supported card. Kept apart from `NfcWalletConfigs`, so the
 * non-UI consumers of the card registry (the key iterator, the worker-side
 * controller) do not pull SVG components into their bundles.
 */
export const NfcWalletIcons: Record<NfcWalletType, React.FC<SvgProps>> = {
  keycard: KeycardIcon
}

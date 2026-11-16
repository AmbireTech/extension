import React from 'react'
import { ViewStyle } from 'react-native'

import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import spacings from '@common/styles/spacings'

type Props = {
  title: string
  description: string
  isOn: boolean
  onToggle: () => void
  style?: ViewStyle
  testID?: string
}

/**
 * The card for a recovery phrase passphrase choice, e.g. whether the phrase has one or whether
 * it is saved on this device
 */
const PassphraseToggle = ({ title, description, isOn, onToggle, style, testID }: Props) => (
  <ControlOption
    title={title}
    description={description}
    descriptionFontSize={12}
    forceDescriptionOnMobile
    style={{ ...spacings.pvTy, ...style }}
  >
    <FatToggle
      testID={testID}
      isOn={isOn}
      onToggle={onToggle}
      width={44}
      height={24}
      trackStyle={spacings.mr0}
    />
  </ControlOption>
)

export default React.memo(PassphraseToggle)

import React from 'react'
import { ViewStyle } from 'react-native'

import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'

type Props = {
  isOn: boolean
  onToggle: () => void
  style?: ViewStyle
  testID?: string
}

/** The card for choosing whether a recovery phrase passphrase is saved on this device */
const SavePassphraseToggle = ({ isOn, onToggle, style, testID }: Props) => {
  const { t } = useTranslation()

  return (
    <ControlOption
      title={t('Save passphrase')}
      description={t("You won't be asked for it next time you add accounts.")}
      descriptionFontSize={12}
      forceDescriptionOnMobile
      style={style}
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
}

export default React.memo(SavePassphraseToggle)

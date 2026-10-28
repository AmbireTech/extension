import React from 'react'

import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'

type Props = {
  isOn: boolean
  onToggle: () => void
  testID?: string
}

/** The card for telling whether a recovery phrase being imported was set up with a passphrase */
const HasPassphraseToggle = ({ isOn, onToggle, testID }: Props) => {
  const { t } = useTranslation()

  return (
    <ControlOption
      title={t('I have a passphrase')}
      description={t('Not sure? Leave it off.')}
      descriptionFontSize={12}
      forceDescriptionOnMobile
      style={spacings.pvTy}
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

export default React.memo(HasPassphraseToggle)

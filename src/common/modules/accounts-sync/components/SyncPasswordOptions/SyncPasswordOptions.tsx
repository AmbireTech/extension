import React from 'react'
import { View } from 'react-native'

import FatToggle from '@common/components/FatToggle'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type ToggleRowProps = {
  label: string
  description?: string
  isOn: boolean
  onToggle: () => void
}

const ToggleRow = ({ label, description, isOn, onToggle }: ToggleRowProps) => (
  <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtSm]}>
    <View style={[flexbox.flex1, spacings.prSm]}>
      <Text fontSize={14} weight="medium">
        {label}
      </Text>
      {!!description && (
        <Text fontSize={12} appearance="secondaryText">
          {description}
        </Text>
      )}
    </View>
    {/* The track carries a right margin of its own, which would leave the toggle off the
    edge the rest of the sheet is aligned to */}
    <FatToggle isOn={isOn} onToggle={onToggle} width={44} height={22} trackStyle={spacings.mr0} />
  </View>
)

type Props = {
  isPasswordReused: boolean
  onTogglePasswordReuse: () => void
  /** Biometrics unlock the reused password, so its toggle is only shown along with it */
  isBiometricsAvailable?: boolean
  isBiometricsEnabled?: boolean
  onToggleBiometrics?: () => void
}

/**
 * The onboarding options of a sync import: whether the password of the other device
 * becomes this one's password too, and whether biometrics are set up with it.
 */
const SyncPasswordOptions = ({
  isPasswordReused,
  onTogglePasswordReuse,
  isBiometricsAvailable,
  isBiometricsEnabled,
  onToggleBiometrics
}: Props) => {
  const { t } = useTranslation()

  return (
    <>
      <ToggleRow
        label={
          isMobile
            ? t('Set up Ambire mobile with the same password')
            : t('Set up Ambire extension with the same password')
        }
        isOn={isPasswordReused}
        onToggle={onTogglePasswordReuse}
      />
      {isPasswordReused && !!isBiometricsAvailable && !!onToggleBiometrics && (
        <ToggleRow
          label={t('Enable biometrics')}
          isOn={!!isBiometricsEnabled}
          onToggle={onToggleBiometrics}
        />
      )}
    </>
  )
}

export default React.memo(SyncPasswordOptions)

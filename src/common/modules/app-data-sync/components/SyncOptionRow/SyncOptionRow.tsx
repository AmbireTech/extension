import React, { useCallback } from 'react'
import { View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import AddressBookIcon from '@common/assets/svg/AddressBookIcon'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import Checkbox from '@common/components/Checkbox'
import Text from '@common/components/Text'
import { useCustomHover, AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import getAccountStyles, {
  ACCOUNT_AVATAR_SIZE
} from '@common/modules/account-select/components/Account/styles'
import type { SyncOption } from '@common/modules/app-data-sync/hooks/useAppDataSyncExport/useAppDataSyncExport'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const OPTION_ICONS: Record<SyncOption, React.FC<SvgProps>> = {
  settings: SettingsIcon,
  networks: NetworksIcon,
  addressBook: AddressBookIcon
}

interface Props {
  option: SyncOption
  title: string
  /** Explains what gets exported with this option */
  subtitle: string
  isSelected: boolean
  onToggle: (option: SyncOption) => void
}

/**
 * A row of the export selection for something other than an account (settings, networks,
 * Address Book). It has the height, the checkbox and an icon in place of the avatar of the
 * account rows below it, so the whole list reads as one.
 */
const SyncOptionRow = ({ option, title, subtitle, isSelected, onToggle }: Props) => {
  const { theme, styles } = useTheme(getAccountStyles)
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    // The same card as the account rows below it
    values: { from: theme.secondaryBackground, to: theme.tertiaryBackground }
  })

  const handleToggle = useCallback(() => onToggle(option), [onToggle, option])
  const Icon = OPTION_ICONS[option]

  return (
    <AnimatedPressable
      testID={`sync-option-${option}`}
      onPress={handleToggle}
      {...bindAnim}
      style={[styles.accountContainer, animStyle]}
    >
      <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
        <Checkbox value={isSelected} onValueChange={handleToggle} style={spacings.mb0} />
        {/* Spaced from the text like the avatar of the account rows */}
        <View
          style={[
            spacings.mrTy,
            flexbox.alignCenter,
            flexbox.justifyCenter,
            {
              width: ACCOUNT_AVATAR_SIZE,
              height: ACCOUNT_AVATAR_SIZE,
              borderRadius: ACCOUNT_AVATAR_SIZE / 2,
              // Stands out from the card, also when hovered
              backgroundColor: theme.primaryBackground
            }
          ]}
        >
          <Icon />
        </View>
        <View style={[flexbox.flex1, flexbox.justifyCenter]}>
          <Text fontSize={14} weight="medium" numberOfLines={1} style={styles.label}>
            {title}
          </Text>
          <Text fontSize={12} appearance="secondaryText" numberOfLines={2} style={spacings.mtMi}>
            {subtitle}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(SyncOptionRow)

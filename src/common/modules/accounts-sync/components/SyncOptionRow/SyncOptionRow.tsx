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
import getAccountStyles from '@common/modules/account-select/components/Account/styles'
import type { SyncOption } from '@common/modules/accounts-sync/hooks/useAccountsSyncExport/useAccountsSyncExport'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

/** The size of the account avatars, so the titles line up with the account names */
const ICON_CIRCLE_SIZE = 40

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
    values: { from: theme.primaryBackground, to: theme.secondaryBackground }
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
              width: ICON_CIRCLE_SIZE,
              height: ICON_CIRCLE_SIZE,
              borderRadius: ICON_CIRCLE_SIZE / 2,
              backgroundColor: theme.tertiaryBackground
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

import React, { useCallback } from 'react'
import { View } from 'react-native'

import Checkbox from '@common/components/Checkbox'
import Text from '@common/components/Text'
import { useCustomHover, AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import getAccountStyles from '@common/modules/account-select/components/Account/styles'
import type { SyncOption } from '@common/modules/accounts-sync/hooks/useAccountsSyncExport/useAccountsSyncExport'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

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
 * Address Book). It has the height and the checkbox of the account rows below it, so the
 * whole list reads as one.
 */
const SyncOptionRow = ({ option, title, subtitle, isSelected, onToggle }: Props) => {
  const { theme, styles } = useTheme(getAccountStyles)
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: { from: theme.primaryBackground, to: theme.secondaryBackground }
  })

  const handleToggle = useCallback(() => onToggle(option), [onToggle, option])

  return (
    <AnimatedPressable
      testID={`sync-option-${option}`}
      onPress={handleToggle}
      {...bindAnim}
      style={[styles.accountContainer, animStyle]}
    >
      <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
        <Checkbox value={isSelected} onValueChange={handleToggle} style={spacings.mb0} />
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

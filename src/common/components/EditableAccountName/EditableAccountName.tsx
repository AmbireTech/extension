import React, { useCallback, useState } from 'react'
import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import EditPenIcon from '@common/assets/svg/EditPenIcon'
import EditAccountNameBottomSheet from '@common/components/EditAccountNameBottomSheet'
import Text, { Props as TextProps } from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  account: Account
  /** The name as currently stored - see `currentName` of `EditAccountNameBottomSheet` */
  name: string
  /** See `onSave` of `EditAccountNameBottomSheet` */
  onSave: (name: string) => Promise<void>
  textProps?: TextProps
  disabled?: boolean
  testID?: string
}

/**
 * An account name with a pencil button next to it that opens a modal for renaming the account
 */
const EditableAccountName = ({
  account,
  name,
  onSave,
  textProps,
  disabled,
  testID = 'edit-account-name'
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [bindEditAnim, editAnimStyle] = useHover({ preset: 'opacityInverted' })
  // The sheet is mounted only while open, as some screens render one of these per account
  const [isSheetMounted, setIsSheetMounted] = useState(false)

  const openSheet = useCallback(() => setIsSheetMounted(true), [])
  const unmountSheet = useCallback(() => setIsSheetMounted(false), [])

  return (
    <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
      <Text
        fontSize={16}
        appearance={name ? 'primaryText' : 'secondaryText'}
        numberOfLines={1}
        style={{ flexShrink: 1 }}
        {...textProps}
      >
        {name || t('Not labeled')}
      </Text>
      {!disabled && (
        <AnimatedPressable
          onPress={openSheet}
          style={[spacings.mlTy, editAnimStyle]}
          {...bindEditAnim}
          accessibilityRole="button"
          accessibilityLabel={t('Edit account name')}
          testID={`edit-btn-for-${testID}`}
        >
          <EditPenIcon color={theme.iconPrimary} width={20} height={20} />
        </AnimatedPressable>
      )}
      {isSheetMounted && (
        <EditAccountNameBottomSheet
          account={account}
          currentName={name}
          onSave={onSave}
          onClosed={unmountSheet}
          testID={testID}
        />
      )}
    </View>
  )
}

export default React.memo(EditableAccountName)

import React, { useCallback, useState } from 'react'
import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import Avatar from '@common/components/Avatar'
import EditNameBottomSheet from '@common/components/EditNameBottomSheet'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

/** The longest account name a user can enter */
export const ACCOUNT_NAME_MAX_LENGTH = 40

type Props = {
  account: Account
  /** The name as currently stored, which the input starts with */
  currentName: string
  /**
   * Saves the new name. The sheet keeps loading until the returned promise settles,
   * then closes on success or shows an error and stays open on failure
   */
  onSave: (name: string) => Promise<void>
  /** Called once the closing animation ends, so the caller can unmount the sheet */
  onClosed: () => void
  testID?: string
}

/**
 * A modal (a bottom sheet on narrow screens and mobile) for renaming an account.
 * Opens itself on mount and closes itself once the new name is saved.
 */
const EditAccountNameBottomSheet = ({
  account,
  currentName,
  onSave,
  onClosed,
  testID = 'edit-account-name'
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [name, setName] = useState(currentName)

  const trimmedName = name.trim()
  const canSave = !!trimmedName && trimmedName !== currentName

  const handleSave = useCallback(() => onSave(trimmedName), [onSave, trimmedName])

  return (
    <EditNameBottomSheet
      id="edit-account-name"
      title={t('Edit account name')}
      canSave={canSave}
      onSave={handleSave}
      successMessage={t('Account name updated.')}
      onClosed={onClosed}
      testID={testID}
    >
      {(save) => (
        <>
          <View style={[flexbox.alignCenter, spacings.mbXl]}>
            <Avatar
              address={account.addr}
              pfp={account.preferences.pfp}
              smartAccountType={(account.creation && 'Ambire') || (account.safeCreation && 'Safe')}
              size={48}
              style={spacings.mbSm}
            />
            <Text fontSize={12} appearance="secondaryText" selectable style={text.center}>
              {account.addr}
            </Text>
          </View>
          <Input
            defaultValue={currentName}
            onChangeText={setName}
            onSubmitEditing={save}
            maxLength={ACCOUNT_NAME_MAX_LENGTH}
            label={t('Account name')}
            // The default background is the sheet's own, which hides the field while it isn't focused
            backgroundColor={theme.secondaryBackground}
            autoFocus
            containerStyle={spacings.mb0}
            testID={testID}
          />
        </>
      )}
    </EditNameBottomSheet>
  )
}

export default React.memo(EditAccountNameBottomSheet)

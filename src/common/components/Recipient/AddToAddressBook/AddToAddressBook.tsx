import React from 'react'
import { Pressable, View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import AddIcon from '@common/assets/svg/AddIcon'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type Props = {
  isRecipientAddressUnknown: boolean
  isRecipientHumanizerKnownTokenOrSmartContract: boolean
  addressValidationMsg: string
  isRecipientAddressSameAsSender: boolean
  onAddToAddressBookPress: () => void
}

const AddToAddressBook = ({
  isRecipientHumanizerKnownTokenOrSmartContract,
  isRecipientAddressUnknown,
  addressValidationMsg,
  isRecipientAddressSameAsSender,
  onAddToAddressBookPress
}: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  return !isRecipientHumanizerKnownTokenOrSmartContract &&
    !!isRecipientAddressUnknown &&
    !isRecipientAddressSameAsSender &&
    addressValidationMsg !== 'Invalid address.' ? (
    <Pressable
      style={({ hovered }: any) => [
        ...(isWeb ? [spacings.mb] : []),
        ...(isWeb ? [spacings.mtTy] : [spacings.mtSm]),
        styles.addressBookButton,
        {
          backgroundColor: hovered
            ? hexToRgba(theme.primaryAccent200, 0.16)
            : theme.primaryAccent100
        }
      ]}
      onPress={onAddToAddressBookPress}
    >
      <AddCircularIcon
        width={isWeb ? 16 : 18}
        height={isWeb ? 16 : 18}
        style={spacings.mrMi}
        color={theme.primaryAccent300}
      />
      <Text
        fontSize={12}
        weight="medium"
        testID="send-form-add-to-address-book-button"
        color={theme.primaryAccent300}
      >
        {t('Add to address book')}
      </Text>
    </Pressable>
  ) : null
}

export default AddToAddressBook

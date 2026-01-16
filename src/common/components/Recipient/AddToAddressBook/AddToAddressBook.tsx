import React from 'react'
import { Pressable, View } from 'react-native'

import AddIcon from '@common/assets/svg/AddIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
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
    <View
      style={[
        spacings.mb,
        spacings.mtTy,
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween
      ]}
    >
      <Pressable
        style={({ hovered }: any) => [
          styles.addressBookButton,
          hovered && { backgroundColor: theme.primary20 }
        ]}
        onPress={onAddToAddressBookPress}
      >
        <AddIcon width={16} height={16} style={spacings.mrMi} color={theme.primary} />
        <Text
          fontSize={12}
          weight="medium"
          appearance="primary"
          testID="send-form-add-to-address-book-button"
        >
          {t('Add to address book')}
        </Text>
      </Pressable>
    </View>
  ) : null
}

export default AddToAddressBook

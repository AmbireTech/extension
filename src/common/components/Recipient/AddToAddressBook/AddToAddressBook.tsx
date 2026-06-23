import React from 'react'
import { Pressable, View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'

import getStyles from './styles'

type Props = {
  isRecipientAddressUnknown: boolean
  isRecipientHumanizerKnownTokenOrSmartContract: boolean
  addressValidationMsg: string
  domainVerificationMessage?: string
  isRecipientAddressSameAsSender: boolean
  onAddToAddressBookPress: () => void
}

const AddToAddressBook = ({
  isRecipientHumanizerKnownTokenOrSmartContract,
  isRecipientAddressUnknown,
  addressValidationMsg,
  domainVerificationMessage,
  isRecipientAddressSameAsSender,
  onAddToAddressBookPress
}: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  const shouldShowAddToAddressBook =
    !isRecipientHumanizerKnownTokenOrSmartContract &&
    !!isRecipientAddressUnknown &&
    !isRecipientAddressSameAsSender &&
    addressValidationMsg !== 'Invalid address.'

  if (!domainVerificationMessage && !shouldShowAddToAddressBook) return null

  return (
    <View
      style={[
        ...(isWeb ? [spacings.mb, spacings.mtTy] : [spacings.mtSm]),
        styles.confirmAddressWrapper
      ]}
    >
      {!!domainVerificationMessage && (
        <Text
          fontSize={12}
          weight="regular"
          appearance="successText"
          numberOfLines={1}
          style={shouldShowAddToAddressBook ? spacings.mrSm : undefined}
        >
          {t(domainVerificationMessage)}
        </Text>
      )}
      {shouldShowAddToAddressBook && (
        <Pressable
          style={({ hovered }: any) => [
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
      )}
    </View>
  )
}

export default AddToAddressBook

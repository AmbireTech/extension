import React from 'react'
import { Pressable, View } from 'react-native'

import { ITransferController } from '@ambire-common/interfaces/transfer'
import AddIcon from '@common/assets/svg/AddIcon'
import Checkbox from '@common/components/Checkbox'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type Props = {
  isRecipientAddressUnknown: boolean
  isRecipientHumanizerKnownTokenOrSmartContract: boolean
  isRecipientAddressUnknownAgreed: ITransferController['isRecipientAddressUnknownAgreed']
  onRecipientCheckboxClick: () => void
  addressValidationMsg: string
  isSWWarningVisible: boolean
  isRecipientAddressSameAsSender: boolean
  onAddToAddressBookPress: () => void
}

const ConfirmAddress = ({
  onRecipientCheckboxClick,
  isRecipientHumanizerKnownTokenOrSmartContract,
  isRecipientAddressUnknown,
  isRecipientAddressUnknownAgreed,
  addressValidationMsg,
  isSWWarningVisible,
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
      style={[spacings.mb, flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}
    >
      <Checkbox
        value={isRecipientAddressUnknownAgreed}
        onValueChange={onRecipientCheckboxClick}
        label={
          isSWWarningVisible
            ? t(
                'I confirm sending to this address and that it’s not a CEX (which won’t support ETH deposits from smart wallets).'
              )
            : t('Confirm sending to this address.')
        }
        style={spacings.mb0}
        testID="recipient-address-unknown-checkbox"
      />
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

export default ConfirmAddress

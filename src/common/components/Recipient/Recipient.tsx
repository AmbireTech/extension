import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { InputProps } from '@common/components/Input'
import ConfirmAddress from '@web/modules/transfer/components/ConfirmAddress'

import RecipientInput from '../RecipientInput'
import Text from '../Text'
import styles from './styles'

interface Props extends InputProps {
  setAddress: (text: string) => void
  address: string
  uDAddress: string
  ensAddress: string
  addressValidationMsg: string
  isRecipientSmartContract: boolean
  isRecipientAddressUnknown: boolean
  isRecipientAddressUnknownAgreed: boolean
  onRecipientAddressUnknownCheckboxClick: () => void
  isRecipientDomainResolving: boolean
}

const Recipient: React.FC<Props> = ({
  setAddress,
  address,
  uDAddress,
  ensAddress,
  addressValidationMsg,
  isRecipientAddressUnknownAgreed,
  onRecipientAddressUnknownCheckboxClick,
  isRecipientSmartContract,
  isRecipientAddressUnknown,
  isRecipientDomainResolving
}) => {
  const { t } = useTranslation()

  return (
    <>
      <RecipientInput
        containerStyle={styles.inputContainer}
        isValidUDomain={!!uDAddress}
        isValidEns={!!ensAddress}
        label="Add Recipient"
        isValid={address.length > 1 && !addressValidationMsg && (!!uDAddress || !!ensAddress)}
        error={address.length > 1 && addressValidationMsg}
        value={address}
        onChangeText={setAddress}
        isRecipientDomainResolving={isRecipientDomainResolving}
      />
      <View style={styles.inputBottom}>
        <Text style={styles.doubleCheckMessage} weight="regular" fontSize={14}>
          {t(
            'Please double-check the recipient address, blockchain transactions are not reversible.'
          )}
        </Text>

        <ConfirmAddress
          onRecipientAddressUnknownCheckboxClick={onRecipientAddressUnknownCheckboxClick}
          isRecipientSmartContract={isRecipientSmartContract}
          isRecipientAddressUnknown={isRecipientAddressUnknown}
          isRecipientAddressUnknownAgreed={isRecipientAddressUnknownAgreed}
          addressValidationMsg={addressValidationMsg}
          // @TODO: Address book
          onAddToAddressBook={() => {}}
        />
      </View>
    </>
  )
}

export default React.memo(Recipient)

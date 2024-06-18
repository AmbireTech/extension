import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { TransferController } from '@ambire-common/controllers/transfer/transfer'
import { TokenResult } from '@ambire-common/libs/portfolio'
import AccountsFilledIcon from '@common/assets/svg/AccountsFilledIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import AddressInput from '@common/components/AddressInput'
import { AddressValidation } from '@common/components/AddressInput/AddressInput'
import { InputProps } from '@common/components/Input'
import Text from '@common/components/Text'
import useSelect from '@common/hooks/useSelect'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

import AddContactBottomSheet from './AddContactBottomSheet'
import AddressBookDropdown from './AddressBookDropdown'
import ConfirmAddress from './ConfirmAddress'
import styles from './styles'

interface Props extends InputProps {
  setAddress: (text: string) => void
  address: string
  uDAddress: string
  ensAddress: string
  addressValidationMsg: string
  isRecipientHumanizerKnownTokenOrSmartContract: boolean
  isRecipientAddressUnknown: boolean
  isRecipientAddressUnknownAgreed: TransferController['isRecipientAddressUnknownAgreed']
  onRecipientAddressUnknownCheckboxClick: () => void
  validation: AddressValidation
  isRecipientDomainResolving: boolean
  isSWWarningVisible: boolean
  isSWWarningAgreed: boolean
  selectedTokenSymbol?: TokenResult['symbol']
}

const ADDRESS_BOOK_VISIBLE_VALIDATION = {
  isError: true, // Don't let the user submit, just in case there is an error
  message: ''
}

const Recipient: React.FC<Props> = ({
  setAddress,
  address,
  uDAddress,
  ensAddress,
  addressValidationMsg,
  isRecipientAddressUnknownAgreed,
  onRecipientAddressUnknownCheckboxClick,
  isRecipientHumanizerKnownTokenOrSmartContract,
  isRecipientAddressUnknown,
  validation,
  isRecipientDomainResolving,
  disabled,
  isSWWarningVisible,
  isSWWarningAgreed,
  selectedTokenSymbol
}) => {
  const { selectedAccount } = useMainControllerState()
  const actualAddress = ensAddress || uDAddress || address
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { contacts } = useAddressBookControllerState()
  const {
    selectRef: addressBookSelectRef,
    menuRef: addressBookMenuRef,
    isMenuOpen: isAddressBookVisible,
    setIsMenuOpen: setIsAddressBookVisible,
    toggleMenu: toggleAddressBookMenu,
    menuProps
  } = useSelect()

  const isAddressInAddressBook = contacts.some((contact) => {
    return actualAddress.toLowerCase() === contact.address.toLowerCase()
  })

  const filteredContacts = contacts.filter((contact) => {
    if (!actualAddress) return true

    const lowercaseActualAddress = actualAddress.toLowerCase()
    const lowercaseName = contact.name.toLowerCase()
    const lowercaseAddress = contact.address.toLowerCase()

    return (
      lowercaseAddress.includes(lowercaseActualAddress) ||
      lowercaseName.includes(lowercaseActualAddress)
    )
  })

  const setAddressAndCloseAddressBook = (newAddress: string) => {
    setIsAddressBookVisible(false)
    setAddress(newAddress)
  }

  const visualizeAddressBookDropdown = () => {
    setIsAddressBookVisible(true)
  }

  const selectSingleContactResult = () => {
    if (!isAddressBookVisible || filteredContacts.length !== 1) return

    setAddressAndCloseAddressBook(filteredContacts[0].address)
  }

  return (
    <>
      <AddressInput
        validation={isAddressBookVisible ? ADDRESS_BOOK_VISIBLE_VALIDATION : validation}
        containerStyle={styles.inputContainer}
        udAddress={uDAddress}
        ensAddress={ensAddress}
        isRecipientDomainResolving={isRecipientDomainResolving}
        label="Add Recipient"
        value={address}
        onChangeText={setAddress}
        disabled={disabled}
        onFocus={visualizeAddressBookDropdown}
        inputBorderWrapperRef={addressBookSelectRef}
        onSubmitEditing={selectSingleContactResult}
        childrenBelowInput={
          <AddressBookDropdown
            isVisible={isAddressBookVisible}
            setIsVisible={setIsAddressBookVisible}
            filteredContacts={filteredContacts}
            passRef={addressBookMenuRef}
            onContactPress={setAddressAndCloseAddressBook}
            menuProps={menuProps}
            search={actualAddress}
          />
        }
        childrenBeforeButtons={
          <AccountsFilledIcon
            color={theme[isAddressInAddressBook ? 'primary' : 'secondaryText']}
            opacity={isAddressInAddressBook ? 1 : 0.25}
            style={spacings.mrTy}
            width={24}
            height={24}
          />
        }
        button={isAddressBookVisible ? <UpArrowIcon /> : <DownArrowIcon />}
        buttonProps={{
          onPress: toggleAddressBookMenu
        }}
      />
      <View style={styles.inputBottom}>
        <Text
          style={styles.doubleCheckMessage}
          weight="regular"
          fontSize={12}
          appearance="secondaryText"
        >
          {t(
            'Please double-check the recipient address, blockchain transactions are not reversible.'
          )}
        </Text>

        <ConfirmAddress
          onRecipientAddressUnknownCheckboxClick={onRecipientAddressUnknownCheckboxClick}
          isRecipientHumanizerKnownTokenOrSmartContract={
            isRecipientHumanizerKnownTokenOrSmartContract
          }
          isRecipientAddressUnknown={isRecipientAddressUnknown}
          isRecipientAddressUnknownAgreed={isRecipientAddressUnknownAgreed}
          isRecipientAddressSameAsSender={actualAddress === selectedAccount}
          addressValidationMsg={addressValidationMsg}
          onAddToAddressBook={openBottomSheet}
          isSWWarningVisible={isSWWarningVisible}
          isSWWarningAgreed={isSWWarningAgreed}
          selectedTokenSymbol={selectedTokenSymbol}
        />
      </View>
      <AddContactBottomSheet
        sheetRef={sheetRef}
        address={ensAddress || uDAddress || address}
        closeBottomSheet={closeBottomSheet}
      />
    </>
  )
}

export default React.memo(Recipient)

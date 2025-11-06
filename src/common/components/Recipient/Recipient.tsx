import Fuse from 'fuse.js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Contact } from '@ambire-common/controllers/addressBook/addressBook'
import { ITransferController } from '@ambire-common/interfaces/transfer'
import { TokenResult } from '@ambire-common/libs/portfolio'
import { validateAddress } from '@ambire-common/services/validations'
import AccountsFilledIcon from '@common/assets/svg/AccountsFilledIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import WalletFilledIcon from '@common/assets/svg/WalletFilledIcon'
import AddressBookContact from '@common/components/AddressBookContact'
import AddressInput from '@common/components/AddressInput'
import { AddressValidation } from '@common/components/AddressInput/AddressInput'
import { InputProps } from '@common/components/Input'
import AddContactBottomSheet from '@common/components/Recipient/AddContactBottomSheet'
import ConfirmAddress from '@common/components/Recipient/ConfirmAddress'
import { SectionedSelect } from '@common/components/Select'
import {
  RenderSelectedOptionParams,
  SectionedSelectProps,
  SelectValue
} from '@common/components/Select/types'
import Text from '@common/components/Text'
import TitleAndIcon from '@common/components/TitleAndIcon'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'
import useDomainsControllerState from '@web/hooks/useDomainsController/useDomainsController'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

import styles from './styles'

interface Props extends InputProps {
  setAddress: (text: string) => void
  address: string
  ensAddress: string
  addressValidationMsg: string
  isRecipientHumanizerKnownTokenOrSmartContract: boolean
  isRecipientAddressUnknown: boolean
  isRecipientAddressUnknownAgreed: ITransferController['isRecipientAddressUnknownAgreed']
  onRecipientCheckboxClick: () => void
  validation: AddressValidation
  isRecipientDomainResolving: boolean
  isSWWarningVisible: boolean
  isSWWarningAgreed: boolean
  selectedTokenSymbol?: TokenResult['symbol']
  menuPosition?: 'top' | 'bottom'
}

const ADDRESS_BOOK_VISIBLE_VALIDATION = {
  isError: true, // Don't let the user submit, just in case there is an error
  message: ''
}

const SelectedMenuOption: React.FC<{
  selectRef: React.RefObject<any>
  validation: AddressValidation
  isMenuOpen: boolean
  ensAddress: string
  isRecipientDomainResolving: boolean
  address: string
  setAddress: (text: string) => void
  disabled?: boolean
  setIsMenuOpen: (isMenuOpen: boolean) => void
  filteredContacts: Contact[]
}> = ({
  selectRef,
  filteredContacts,
  validation,
  isMenuOpen,
  ensAddress,
  isRecipientDomainResolving,
  address,
  setAddress,
  disabled,
  setIsMenuOpen
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const prevFilteredContactsLength = usePrevious(filteredContacts.length)

  const isValidAddress = useMemo(
    () => !!validateAddress(ensAddress || address).success,
    [ensAddress, address]
  )
  const prevIsValidAddress = usePrevious(isValidAddress)

  useEffect(() => {
    if (isMenuOpen && !filteredContacts.length && !!isFocused) {
      setIsMenuOpen(false)
    }
    if (!isMenuOpen && !prevFilteredContactsLength && !!filteredContacts.length && !!isFocused) {
      setIsMenuOpen(true)
    }
    if (!prevIsValidAddress && isValidAddress) {
      setIsMenuOpen(false)
    }
  }, [
    address,
    filteredContacts.length,
    prevFilteredContactsLength,
    isMenuOpen,
    setIsMenuOpen,
    isFocused,
    prevIsValidAddress,
    isValidAddress
  ])

  return (
    <AddressInput
      inputBorderWrapperRef={selectRef}
      validation={isMenuOpen ? ADDRESS_BOOK_VISIBLE_VALIDATION : validation}
      containerStyle={styles.inputContainer}
      ensAddress={ensAddress}
      isRecipientDomainResolving={isRecipientDomainResolving}
      value={address}
      withDetails
      onChangeText={setAddress}
      disabled={disabled}
      onFocus={() => {
        setIsFocused(true)
        if (filteredContacts.length) {
          setIsMenuOpen(true)
        }
      }}
      onBlur={() => {
        setIsFocused(false)
      }}
      onClearButtonPress={() => setIsMenuOpen(true)}
      button={address ? undefined : isMenuOpen ? <UpArrowIcon /> : <DownArrowIcon />}
      buttonProps={{
        onPress: () => {
          if (!address || filteredContacts.length) {
            setIsMenuOpen(true)
          }
        }
      }}
      buttonStyle={{ ...spacings.pv0, ...spacings.ph, ...spacings.mr0, ...spacings.ml0 }}
    />
  )
}

const Recipient: React.FC<Props> = ({
  setAddress,
  address,
  ensAddress,
  addressValidationMsg,
  isRecipientAddressUnknownAgreed,
  onRecipientCheckboxClick,
  isRecipientHumanizerKnownTokenOrSmartContract,
  isRecipientAddressUnknown,
  validation,
  isRecipientDomainResolving,
  disabled,
  isSWWarningVisible
}) => {
  const { account } = useSelectedAccountControllerState()
  const actualAddress = ensAddress || address
  const { navigate } = useNavigation()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { contacts } = useAddressBookControllerState()
  const { domains } = useDomainsControllerState()
  const [bindManageBtnAnim, manageBtnAnimStyle] = useHover({
    preset: 'opacityInverted'
  })

  const onManagePress = useCallback(() => {
    navigate(ROUTES.addressBook)
  }, [navigate])

  const searchableContacts = useMemo(
    () =>
      contacts.map((contact) => ({
        contact,
        name: contact.name.toLowerCase(),
        address: contact.address.toLowerCase(),
        domain: domains[contact.address]?.ens?.toLowerCase().trim() || ''
      })),
    [contacts, domains]
  )

  const filteredContacts = useMemo(() => {
    if (!actualAddress) return contacts

    const fuse = new Fuse(searchableContacts, {
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'domain', weight: 0.3 },
        { name: 'address', weight: 0.2 }
      ],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 1
    })

    const results = fuse.search(actualAddress)
    return results.map((result) => result.item.contact)
  }, [contacts, actualAddress, searchableContacts])

  const setAddressWrapped = useCallback(
    ({ value: newAddress }: Pick<SelectValue, 'value'>) => {
      if (typeof newAddress !== 'string') return

      const correspondingDomain = domains[newAddress]?.ens

      setAddress(correspondingDomain || newAddress)
    },
    [domains, setAddress]
  )

  const walletAccountsSourcedContactOptions = useMemo(
    () =>
      filteredContacts
        .filter((contact) => contact.isWalletAccount)
        .map((contact, index) => ({
          value: contact.address,
          label: (
            <AddressBookContact
              avatarSize={32}
              testID={`address-book-my-wallet-contact-${index + 1}`}
              key={contact.address}
              style={{
                borderRadius: 0,
                ...spacings.ph0,
                ...spacings.pv0
              }}
              address={contact.address}
              name={contact.name}
            />
          )
        })),
    [filteredContacts]
  )

  const manuallyAddedContactOptions = useMemo(
    () =>
      filteredContacts
        .filter((contact) => !contact.isWalletAccount)
        .map((contact) => ({
          value: contact.address,
          label: (
            <AddressBookContact
              avatarSize={32}
              key={contact.address}
              style={{
                borderRadius: 0,
                ...spacings.ph0,
                ...spacings.pv0
              }}
              address={contact.address}
              name={contact.name}
            />
          )
        })),
    [filteredContacts]
  )

  const selectedOption = useMemo(
    () =>
      walletAccountsSourcedContactOptions.find((contact) => contact.value === address) ||
      manuallyAddedContactOptions.find((contact) => contact.value === address),
    [walletAccountsSourcedContactOptions, manuallyAddedContactOptions, address]
  )

  const sections = useMemo(() => {
    if (!walletAccountsSourcedContactOptions.length && !manuallyAddedContactOptions.length)
      return []

    return [
      {
        data: walletAccountsSourcedContactOptions,
        key: 'my-wallets'
      },
      {
        data: manuallyAddedContactOptions,
        key: 'contacts'
      }
    ]
  }, [walletAccountsSourcedContactOptions, manuallyAddedContactOptions])

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionedSelectProps['sections'][0] }) => {
      if (section.data.length === 0) return null

      return section.key === 'contacts' ? (
        <TitleAndIcon title={t('Address Book')} icon={AccountsFilledIcon}>
          <AnimatedPressable
            style={[flexbox.directionRow, flexbox.alignCenter, manageBtnAnimStyle]}
            onPress={onManagePress}
            {...bindManageBtnAnim}
          >
            <SettingsIcon width={18} height={18} color={theme.secondaryText} />
            <Text fontSize={14} style={spacings.mlMi} appearance="secondaryText">
              {t('Manage contacts')}
            </Text>
          </AnimatedPressable>
        </TitleAndIcon>
      ) : (
        <TitleAndIcon title={t('My wallets')} icon={WalletFilledIcon} />
      )
    },
    [bindManageBtnAnim, manageBtnAnimStyle, onManagePress, t, theme.secondaryText]
  )

  const renderSelectedOption = useCallback(
    ({ setIsMenuOpen, isMenuOpen, selectRef }: RenderSelectedOptionParams) => {
      return (
        <SelectedMenuOption
          setIsMenuOpen={setIsMenuOpen}
          selectRef={selectRef}
          filteredContacts={filteredContacts}
          isMenuOpen={isMenuOpen}
          validation={validation}
          ensAddress={ensAddress}
          isRecipientDomainResolving={isRecipientDomainResolving}
          address={address}
          setAddress={setAddress}
          disabled={disabled}
        />
      )
    },
    [
      filteredContacts,
      validation,
      ensAddress,
      isRecipientDomainResolving,
      address,
      setAddress,
      disabled
    ]
  )

  return (
    <>
      <Text appearance="secondaryText" fontSize={14} weight="medium" style={spacings.mbMi}>
        {t('Add recipient')}
      </Text>
      <SectionedSelect
        value={selectedOption}
        setValue={setAddressWrapped}
        sections={sections}
        headerHeight={32}
        menuOptionHeight={54}
        withSearch={false}
        renderSectionHeader={renderSectionHeader}
        renderSelectedOption={renderSelectedOption}
        emptyListPlaceholderText={t('No contacts found')}
        menuPosition="bottom"
      />
      <View style={styles.inputBottom}>
        <ConfirmAddress
          onRecipientCheckboxClick={onRecipientCheckboxClick}
          isRecipientHumanizerKnownTokenOrSmartContract={
            isRecipientHumanizerKnownTokenOrSmartContract
          }
          isRecipientAddressUnknown={isRecipientAddressUnknown}
          isRecipientAddressUnknownAgreed={isRecipientAddressUnknownAgreed}
          isRecipientAddressSameAsSender={actualAddress === account?.addr}
          addressValidationMsg={addressValidationMsg}
          isSWWarningVisible={isSWWarningVisible}
          onAddToAddressBookPress={openBottomSheet}
        />
      </View>
      <AddContactBottomSheet
        sheetRef={sheetRef}
        address={ensAddress || address}
        closeBottomSheet={closeBottomSheet}
      />
    </>
  )
}

export default React.memo(Recipient)

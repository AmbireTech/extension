import Fuse from 'fuse.js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorValue, Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Contact } from '@ambire-common/interfaces/addressBook'
import { AddressState } from '@ambire-common/interfaces/domains'
import { AddressPoisoningMatch } from '@ambire-common/interfaces/transfer'
import { getSearchableNames } from '@ambire-common/services/nameResolvers'
import { validateAddress, Validation } from '@ambire-common/services/validations'
import { getIsViewOnly } from '@ambire-common/utils/accounts'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import AddressBookIcon from '@common/assets/svg/AddressBookIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import WalletIcon from '@common/assets/svg/WalletIcon'
import AccountsTabs, { AccountsTab } from '@common/components/AccountsTabs'
import AddressBookContact from '@common/components/AddressBookContact'
import AddressInput from '@common/components/AddressInput'
import AddressScanButton from '@common/components/AddressInput/AddressScanButton'
import AddContactBottomSheet from '@common/components/AddressSelect/AddContactBottomSheet'
import AddToAddressBook from '@common/components/AddressSelect/AddToAddressBook'
import { InputProps } from '@common/components/Input'
import PrivacyPoolsAccountAvatar from '@common/components/PrivacyPoolsAccountAvatar'
import { SectionedSelect } from '@common/components/Select'
import {
  RenderSelectedOptionParams,
  SectionedSelectProps,
  SelectValue
} from '@common/components/Select/types'
import Text from '@common/components/Text'
import TitleAndIcon from '@common/components/TitleAndIcon'
import { isMobile, isPrivacyPoolsEnabled, isTornadoCashEnabled, isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import {
  filterPrivateAccountsBySearch,
  getPrivateAccountKey,
  PrivateAccountDisplay
} from '@common/hooks/usePrivateAccounts'
import { PRIVACY_PROVIDER_NAMES } from '@common/modules/privacy/providers'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import styles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys

export interface AddressSelectProps extends InputProps {
  setAddress: (text: string) => void
  address: string
  resolvedAddress: AddressState['resolvedAddress']
  resolvedAddressType: AddressState['resolvedAddressType']
  validation: Validation
  isRecipientDomainResolving: boolean
  menuPosition?: 'top' | 'bottom'
  // Title of the list, on the surfaces that show it in a bottom sheet.
  bottomSheetTitle?: string
  // Shortens the addresses in the list, for a container too narrow to fit a full one.
  withShortenedAddresses?: boolean
  /** Includes the active wallet account, which is normally omitted to prevent self-transfers. */
  includeSelectedAccount?: boolean
  /**
   * Background color of the idle input. Set it when the parent has the same color as the
   * default input background, so the input stays visible.
   */
  inputBackgroundColor?: ColorValue
  // The props below drive the "Add to address book" prompt, which only applies when the
  // address is a transfer recipient. Other flows can leave them out.
  addressValidationMsg?: string
  domainVerificationMessage?: string
  isRecipientHumanizerKnownTokenOrSmartContract?: boolean
  isRecipientAddressUnknown?: boolean
  addressPoisoningMatch?: AddressPoisoningMatch | null
  /** Listed as recipients. Having no address, picking one calls `onSelectPrivateAccount`. */
  privateAccounts?: PrivateAccountDisplay[]
  onSelectPrivateAccount?: (account: PrivateAccountDisplay) => void
}

// Marks a Privacy Pools account option - see `setAddressWrapped`
const PRIVATE_ACCOUNT_OPTION_VALUE_PREFIX = 'private-account:'

const ADDRESS_BOOK_VISIBLE_VALIDATION: Validation = {
  severity: 'error', // Don't let the user submit, just in case there is an error
  message: ''
}

const SelectedMenuOption: React.FC<{
  selectRef?: React.RefObject<any>
  validation: Validation
  isMenuOpen: boolean
  resolvedAddress: AddressState['resolvedAddress']
  resolvedAddressType: AddressState['resolvedAddressType']
  isRecipientDomainResolving: boolean
  address: string
  setAddress: (text: string) => void
  disabled?: boolean
  setIsMenuOpen: (isMenuOpen: boolean) => void
  filteredContacts: Contact[]
  renderConfirmAddress?: () => React.ReactNode
  type?: 'input' | 'selected-menu-option'
  autoFocus?: boolean
  addressHighlight?: {
    prefix: number
    suffix: number
    color: 'errorText'
  }
  inputBackgroundColor?: ColorValue
  plainAddressMaxLength?: number
}> = ({
  selectRef,
  filteredContacts,
  validation,
  isMenuOpen,
  resolvedAddress,
  resolvedAddressType,
  isRecipientDomainResolving,
  address,
  setAddress,
  disabled,
  setIsMenuOpen,
  renderConfirmAddress,
  type = 'selected-menu-option',
  autoFocus = false,
  addressHighlight,
  inputBackgroundColor,
  plainAddressMaxLength
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const { theme } = useTheme()
  const prevFilteredContactsLength = usePrevious(filteredContacts.length)

  const isValidAddress = useMemo(
    () =>
      validateAddress(getAddressFromAddressState({ resolvedAddress, fieldValue: address }))
        .severity === 'success',
    [resolvedAddress, address]
  )
  const prevIsValidAddress = usePrevious(isValidAddress)

  useEffect(() => {
    if (type === 'input') return

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
    isValidAddress,
    type
  ])

  const isButtonMode = type === 'selected-menu-option' && isMobile

  const content = useMemo(
    () => (
      <AddressInput
        inputBorderWrapperRef={selectRef}
        validation={
          isMenuOpen && type === 'selected-menu-option'
            ? ADDRESS_BOOK_VISIBLE_VALIDATION
            : validation
        }
        autoFocus={autoFocus}
        // Address entry never benefits from the keyboard's autocorrect
        autoCorrect={false}
        containerStyle={styles.inputContainer}
        backgroundColor={inputBackgroundColor}
        resolvedAddress={resolvedAddress}
        resolvedAddressType={resolvedAddressType}
        addressHighlight={addressHighlight}
        plainAddressMaxLength={plainAddressMaxLength}
        isRecipientDomainResolving={isRecipientDomainResolving}
        value={address}
        // On mobile input mode we still need details view when poisoning highlight exists,
        // because highlight rendering lives in the detailed address row.
        withDetails={type === 'selected-menu-option' || (isMobile && !!addressHighlight)}
        onChangeText={setAddress}
        onScanAddress={type === 'input' ? setAddress : undefined}
        // The collapsed row is a button that opens the contacts menu, so the scan
        // icon is rendered next to the dropdown arrow to stay reachable without it.
        childrenBeforeButtons={
          isButtonMode && !address ? <AddressScanButton onScanned={setAddress} /> : undefined
        }
        disabled={disabled}
        editable={!isButtonMode}
        pointerEvents={isButtonMode ? 'none' : 'auto'}
        renderConfirmAddress={renderConfirmAddress}
        onFocus={() => {
          setIsFocused(true)
          if (type === 'input') return

          if (filteredContacts.length) {
            setIsMenuOpen(true)
          }
        }}
        onBlur={() => {
          if (type === 'input') return

          setIsFocused(false)
        }}
        onClearButtonPress={() => setIsMenuOpen(true)}
        button={
          type === 'input' || address ? undefined : isMenuOpen ? <UpArrowIcon /> : <DownArrowIcon />
        }
        buttonProps={{ onPress: () => setIsMenuOpen(true) }}
        inputWrapperStyle={type === 'input' ? { backgroundColor: theme.neutral400 } : undefined}
        buttonStyle={{
          ...spacings.pv0,
          // Even padding keeps the clear button's press area centered on its icon
          ...(address ? spacings.phTy : { ...spacings.pl, ...spacings.prTy }),
          ...spacings.mr0,
          ...spacings.ml0
        }}
      />
    ),
    [
      address,
      autoFocus,
      disabled,
      resolvedAddress,
      filteredContacts.length,
      isButtonMode,
      isMenuOpen,
      isRecipientDomainResolving,
      resolvedAddressType,
      renderConfirmAddress,
      selectRef,
      setAddress,
      setIsMenuOpen,
      theme.neutral400,
      addressHighlight,
      inputBackgroundColor,
      plainAddressMaxLength,
      type,
      validation
    ]
  )

  return isButtonMode ? (
    <Pressable onPress={() => setIsMenuOpen(true)}>{content}</Pressable>
  ) : (
    content
  )
}

// An address field that doubles as a picker: the user can type, paste or scan an address,
// or pick one of their own wallets or address book contacts from the list it drops down.
const AddressSelect: React.FC<AddressSelectProps> = ({
  setAddress,
  address,
  resolvedAddress,
  resolvedAddressType,
  addressValidationMsg = '',
  domainVerificationMessage,
  isRecipientHumanizerKnownTokenOrSmartContract = false,
  isRecipientAddressUnknown = false,
  validation,
  isRecipientDomainResolving,
  disabled,
  addressPoisoningMatch,
  bottomSheetTitle,
  withShortenedAddresses,
  includeSelectedAccount = false,
  inputBackgroundColor,
  privateAccounts,
  onSelectPrivateAccount
}) => {
  const { isNarrowWebLayout } = useCompactLayout()
  const { state: account } = useController('SelectedAccountController', 'account')
  const { state: keys } = useController('KeystoreController', selectKeys)
  const canSendToPrivateAccounts = useMemo(
    () => !account || !getIsViewOnly(keys, account.associatedKeys),
    [account, keys]
  )
  const actualAddress = getAddressFromAddressState({
    resolvedAddress,
    fieldValue: address
  })
  const { navigate } = useNavigation()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const contactAddressMaxLength = isNarrowWebLayout || withShortenedAddresses ? 16 : undefined
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { state: contacts } = useController('AddressBookController', 'contacts')
  const {
    state: { domains }
  } = useController('DomainsController')
  const [bindManageBtnAnim, manageBtnAnimStyle] = useHover({
    preset: 'opacityInverted'
  })
  // Split like the accounts list: private accounts (Privacy Pools, Tornado Cash), having no
  // address, are private. Without them, the list is as it was
  const hasAccountsTabs =
    (isPrivacyPoolsEnabled || isTornadoCashEnabled) && !!onSelectPrivateAccount
  // The search stays when switching tabs, so it filters the newly opened tab too
  const [activeTab, setActiveTab] = useState<AccountsTab>('public')

  const selectableContacts = useMemo<Contact[]>(() => {
    if (!includeSelectedAccount || !account) return contacts
    const isSelectedAccountIncluded = contacts.some(
      ({ address: contactAddress }) => contactAddress.toLowerCase() === account.addr.toLowerCase()
    )
    if (isSelectedAccountIncluded) return contacts

    return [
      {
        name: account.preferences.label,
        address: account.addr,
        isWalletAccount: true
      },
      ...contacts
    ]
  }, [account, contacts, includeSelectedAccount])

  const onManagePress = useCallback(() => {
    navigate(ROUTES.addressBook)
  }, [navigate])

  const searchableContacts = useMemo(
    () =>
      selectableContacts.map((contact) => ({
        contact,
        name: contact.name.toLowerCase(),
        address: contact.address.toLowerCase(),
        domain: getSearchableNames(domains[contact.address]?.names)
      })),
    [selectableContacts, domains]
  )

  const filteredContacts = useMemo(() => {
    if (!actualAddress) return selectableContacts

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
  }, [selectableContacts, actualAddress, searchableContacts])

  const filteredPrivateAccounts = useMemo(
    () =>
      privateAccounts && onSelectPrivateAccount
        ? filterPrivateAccountsBySearch(privateAccounts, isMobile ? '' : actualAddress)
        : [],
    [privateAccounts, onSelectPrivateAccount, actualAddress]
  )

  // Looked up rather than parsed back from the option value
  const privateAccountByOptionValue = useMemo(
    () =>
      new Map(
        filteredPrivateAccounts.map((account) => [
          `${PRIVATE_ACCOUNT_OPTION_VALUE_PREFIX}${getPrivateAccountKey(account)}`,
          account
        ])
      ),
    [filteredPrivateAccounts]
  )

  const setAddressWrapped = useCallback(
    ({ value: newAddress }: Pick<SelectValue, 'value'>) => {
      if (typeof newAddress !== 'string') return

      const privateAccount = privateAccountByOptionValue.get(newAddress)
      if (privateAccount) {
        onSelectPrivateAccount?.(privateAccount)
        return
      }

      setAddress(newAddress)
    },
    [onSelectPrivateAccount, privateAccountByOptionValue, setAddress]
  )

  const privacyPoolsAccountOptions = useMemo(
    () =>
      filteredPrivateAccounts.map((account) => ({
        value: `${PRIVATE_ACCOUNT_OPTION_VALUE_PREFIX}${getPrivateAccountKey(account)}`,
        // Named like in the accounts list: the account has no name or address of its own
        label: (
          <View
            testID={`address-book-private-account-${account.providerId}-${account.seedId}`}
            style={[flexbox.directionRow, flexbox.alignCenter]}
          >
            <PrivacyPoolsAccountAvatar size={32} style={spacings.mrTy} />
            <View style={flexbox.flex1}>
              <Text fontSize={14} weight="medium" numberOfLines={1}>
                {t('Private account')}
              </Text>
              <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
                {t('{{provider}}, added from {{seedLabel}}', {
                  provider: PRIVACY_PROVIDER_NAMES[account.providerId],
                  seedLabel: account.label
                })}
              </Text>
            </View>
          </View>
        )
      })),
    [filteredPrivateAccounts, t]
  )

  const walletAccountsSourcedContactOptions = useMemo(
    () =>
      (isMobile ? selectableContacts : filteredContacts)
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
              plainAddressMaxLength={contactAddressMaxLength}
              // Tapping a row selects the address, so a copy icon is not needed on mobile
              withCopy={isWeb}
            />
          )
        })),
    [selectableContacts, filteredContacts, contactAddressMaxLength]
  )

  const manuallyAddedContactOptions = useMemo(
    () =>
      (isMobile ? selectableContacts : filteredContacts)
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
              plainAddressMaxLength={contactAddressMaxLength}
              withCopy={isWeb}
            />
          )
        })),
    [selectableContacts, filteredContacts, contactAddressMaxLength]
  )

  const selectedOption = useMemo(
    () =>
      walletAccountsSourcedContactOptions.find((contact) => contact.value === address) ||
      manuallyAddedContactOptions.find((contact) => contact.value === address),
    [walletAccountsSourcedContactOptions, manuallyAddedContactOptions, address]
  )

  const sections = useMemo(() => {
    const myWallets = { data: walletAccountsSourcedContactOptions, key: 'my-wallets' }
    const privacyPoolsAccountsSection = {
      data: privacyPoolsAccountOptions,
      key: 'privacy-pools-accounts'
    }
    const addressBook = { data: manuallyAddedContactOptions, key: 'contacts' }
    const shownSections = !hasAccountsTabs
      ? [myWallets, addressBook]
      : activeTab === 'private'
        ? [privacyPoolsAccountsSection]
        : [myWallets, addressBook]

    if (shownSections.every(({ data }) => !data.length)) return []

    return shownSections
  }, [
    activeTab,
    hasAccountsTabs,
    walletAccountsSourcedContactOptions,
    privacyPoolsAccountOptions,
    manuallyAddedContactOptions
  ])

  const accountsTabs = useMemo(
    () =>
      hasAccountsTabs ? (
        <AccountsTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          disabledTabReasons={
            canSendToPrivateAccounts
              ? undefined
              : { private: t('A view-only account cannot send to a private account.') }
          }
          style={spacings.mvTy}
        />
      ) : undefined,
    [activeTab, canSendToPrivateAccounts, hasAccountsTabs, t]
  )

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionedSelectProps['sections'][0] }) => {
      if (section.data.length === 0) return null

      return section.key === 'contacts' ? (
        <TitleAndIcon title={t('Address Book')} icon={AddressBookIcon}>
          {isWeb && (
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
          )}
        </TitleAndIcon>
      ) : (
        // The Privacy Pools accounts too: they are the user's own, like those of the public tab
        <TitleAndIcon title={t('My wallets')} icon={WalletIcon} />
      )
    },
    [bindManageBtnAnim, manageBtnAnimStyle, onManagePress, t, theme.secondaryText]
  )

  const renderConfirmAddress = useCallback(
    () => (
      <AddToAddressBook
        isRecipientHumanizerKnownTokenOrSmartContract={
          isRecipientHumanizerKnownTokenOrSmartContract
        }
        isRecipientAddressUnknown={isRecipientAddressUnknown}
        isRecipientAddressSameAsSender={actualAddress === account?.addr}
        addressValidationMsg={addressValidationMsg}
        domainVerificationMessage={domainVerificationMessage}
        onAddToAddressBookPress={openBottomSheet}
      />
    ),
    [
      isRecipientHumanizerKnownTokenOrSmartContract,
      isRecipientAddressUnknown,
      actualAddress,
      account,
      addressValidationMsg,
      domainVerificationMessage,
      openBottomSheet
    ]
  )

  const selectedAddressHighlight = useMemo(
    () =>
      addressPoisoningMatch
        ? {
            prefix: addressPoisoningMatch.matchedPrefixCharsCount,
            suffix: addressPoisoningMatch.matchedSuffixCharsCount,
            color: 'errorText' as const
          }
        : undefined,
    [addressPoisoningMatch]
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
          resolvedAddress={resolvedAddress}
          resolvedAddressType={resolvedAddressType}
          isRecipientDomainResolving={isRecipientDomainResolving}
          address={address}
          setAddress={setAddress}
          disabled={disabled}
          renderConfirmAddress={renderConfirmAddress}
          addressHighlight={selectedAddressHighlight}
          inputBackgroundColor={inputBackgroundColor}
          plainAddressMaxLength={contactAddressMaxLength}
        />
      )
    },
    [
      filteredContacts,
      validation,
      resolvedAddress,
      resolvedAddressType,
      isRecipientDomainResolving,
      address,
      setAddress,
      disabled,
      renderConfirmAddress,
      selectedAddressHighlight,
      inputBackgroundColor,
      contactAddressMaxLength
    ]
  )

  return (
    <>
      <SectionedSelect
        value={selectedOption}
        setValue={setAddressWrapped}
        mode={isNarrowWebLayout ? 'bottomSheet' : undefined}
        sections={sections}
        headerHeight={32}
        menuOptionHeight={54}
        withSearch={false}
        renderSectionHeader={renderSectionHeader}
        renderSelectedOption={renderSelectedOption}
        emptyListPlaceholderText={
          hasAccountsTabs && activeTab === 'private'
            ? t('No accounts found')
            : t('No contacts found')
        }
        menuHeader={accountsTabs}
        menuPosition="bottom"
        bottomSheetTitle={bottomSheetTitle}
        isBottomSheetFullHeight
        renderHeaderChildren={({ toggleMenu, isMenuOpen, selectRef }) => (
          <SelectedMenuOption
            type="input"
            selectRef={selectRef}
            autoFocus
            setIsMenuOpen={toggleMenu}
            filteredContacts={filteredContacts}
            isMenuOpen={isMenuOpen}
            validation={validation}
            resolvedAddress={resolvedAddress}
            resolvedAddressType={resolvedAddressType}
            // Keep highlight visible on mobile; don't show resolving UI when poisoning highlight exists.
            isRecipientDomainResolving={isRecipientDomainResolving && !selectedAddressHighlight}
            address={address}
            setAddress={setAddress}
            disabled={disabled}
            addressHighlight={selectedAddressHighlight}
            plainAddressMaxLength={contactAddressMaxLength}
          />
        )}
        containerStyle={spacings.mb0}
      />

      <AddContactBottomSheet
        sheetRef={sheetRef}
        address={getAddressFromAddressState({
          resolvedAddress,
          fieldValue: address
        })}
        closeBottomSheet={closeBottomSheet}
      />
    </>
  )
}

export default React.memo(AddressSelect)

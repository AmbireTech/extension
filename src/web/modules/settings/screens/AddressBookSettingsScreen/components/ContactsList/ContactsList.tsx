import Fuse from 'fuse.js'
import React, { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import AccountsFilledIcon from '@common/assets/svg/AccountsFilledIcon'
import WalletFilledIcon from '@common/assets/svg/WalletFilledIcon'
import AddressBookContact from '@common/components/AddressBookContact'
import Button from '@common/components/Button'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import TitleAndIcon from '@common/components/TitleAndIcon'
import useDebounce from '@common/hooks/useDebounce'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'
import useDomainsControllerState from '@web/hooks/useDomainsController/useDomainsController'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'

import AddContactFormModal from '../AddContactFormModal'

const ContactsList = () => {
  const { t } = useTranslation()
  const {
    ref: addContactFormRef,
    open: openAddContactForm,
    close: closeAddContactForm
  } = useModalize()
  const { contacts } = useAddressBookControllerState()
  const { domains } = useDomainsControllerState()
  const { control, watch } = useForm({
    defaultValues: {
      search: ''
    }
  })

  const search = watch('search')
  const debouncedSearch = useDebounce({ value: search, delay: 350 })

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
    if (!debouncedSearch) return contacts

    const fuse = new Fuse(searchableContacts, {
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'domain', weight: 0.3 },
        { name: 'address', weight: 0.2 }
      ],
      threshold: 0.3,
      ignoreLocation: false, // Prioritize matches at the start
      minMatchCharLength: 1
    })

    const results = fuse.search(debouncedSearch)
    return results.map((result) => result.item.contact)
  }, [contacts, debouncedSearch, searchableContacts])

  const walletAccountsSourcedContacts = filteredContacts.filter(
    (contact) => contact.isWalletAccount
  )
  const manuallyAddedContacts = filteredContacts.filter((contact) => !contact.isWalletAccount)

  const { maxWidthSize } = useWindowSize()
  const isWidthS = maxWidthSize('s')

  const headerChildren = (
    <View
      style={[
        flexbox.flex1,
        isWidthS && flexbox.directionRow,
        flexbox.justifyEnd,
        flexbox.alignCenter
      ]}
    >
      <Button
        testID="add-contact-form-modal"
        text={t('+ Add a contact')}
        type="primary"
        style={[spacings.mrTy, spacings.phXl, { height: 48, width: isWidthS ? undefined : '100%' }]}
        hasBottomSpacing={false}
        onPress={() => openAddContactForm()}
      />
      <Search
        autoFocus
        testID="search-contacts-input"
        placeholder={t('Search contacts')}
        control={control}
        height={48}
        containerStyle={{ width: isWidthS ? '50%' : '100%' }}
      />
    </View>
  )

  return (
    <>
      <SettingsPageHeader title="Address Book">{headerChildren}</SettingsPageHeader>
      <ScrollableWrapper style={flexbox.flex1}>
        {walletAccountsSourcedContacts.length > 0 ? (
          <>
            <TitleAndIcon title={t('My wallets')} icon={WalletFilledIcon} />
            {walletAccountsSourcedContacts.map((contact) => (
              <AddressBookContact
                fontSize={16}
                height={24}
                testID={`name-${contact.name.toLowerCase().replace(/\s+/g, '-')}`}
                key={`${contact.address}-${!contact.isWalletAccount ? 'wallet' : 'address'}`}
                name={contact.name}
                address={contact.address}
                isManageable={!contact.isWalletAccount}
                isEditable
              />
            ))}
          </>
        ) : null}
        {manuallyAddedContacts.length > 0 ? (
          <>
            <TitleAndIcon title={t('Contacts')} icon={AccountsFilledIcon} />
            {manuallyAddedContacts.map((contact) => (
              <AddressBookContact
                testID="contact-name-text"
                key={`${contact.address}-${!contact.isWalletAccount ? 'wallet' : 'address'}`}
                name={contact.name}
                address={contact.address}
                isManageable={!contact.isWalletAccount}
                isEditable
              />
            ))}
          </>
        ) : null}
        {!contacts.length ? (
          <>
            <Text fontSize={14}>{t('Your Address Book is empty.')}</Text>
            <Text fontSize={14} style={spacings.mbXl}>
              {t('Why not add addresses you often interact with to your Address Book?')}
            </Text>
          </>
        ) : null}
        {!filteredContacts.length ? (
          <Text fontSize={14}>{t('No accounts found in your Address Book.')}</Text>
        ) : null}
      </ScrollableWrapper>
      <AddContactFormModal
        id="add-contact-form"
        sheetRef={addContactFormRef}
        closeBottomSheet={closeAddContactForm}
      />
    </>
  )
}

export default ContactsList

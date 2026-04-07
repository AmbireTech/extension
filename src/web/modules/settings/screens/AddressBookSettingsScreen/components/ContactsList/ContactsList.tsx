import Fuse from 'fuse.js'
import React, { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import AddressBookIcon from '@common/assets/svg/AddressBookIcon'
import WalletIcon from '@common/assets/svg/WalletIcon'
import AddressBookContact from '@common/components/AddressBookContact'
import Button from '@common/components/Button'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import TitleAndIcon from '@common/components/TitleAndIcon'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'

import AddContactFormModal from '../AddContactFormModal'

export const ContactWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme()

  return (
    <View
      style={{
        ...spacings.phMi,
        ...spacings.pvMi,
        ...spacings.mbTy,
        backgroundColor: theme.secondaryBackground,
        borderRadius: BORDER_RADIUS_PRIMARY
      }}
    >
      {children}
    </View>
  )
}

const ContactsList = () => {
  const { t } = useTranslation()
  const {
    ref: addContactFormRef,
    open: openAddContactForm,
    close: closeAddContactForm
  } = useModalize()
  const { contacts } = useController('AddressBookController').state
  const {
    state: { domains }
  } = useController('DomainsController')
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
      /*
      `ignoreLocation = false`:
      - Fuse prioritizes matches that appear near the beginning of the string
        (e.g. typing "vi" ranks "Vitalik" above "MyVitalikWallet").
      - We set this explicitly, even though it's the default, to avoid accidental overrides during future refactoring.

      `distance = 1000`:
      - ETH addresses are long, and valid matches often appear near the end.
        By default, Fuse scores these lower, which may exclude them.
      - distance reduces this penalty so such matches are still returned
        (e.g. searching for "33" should match 0x579f87277E14f32df7FA4036D76BbfC94C325033 even though "33" is at the end).
      - distance does NOT represent string length - it controls how strongly Fuse penalizes late-position matches.
        A large value reduces this penalty so end-of-string matches are still returned while start matches remain prioritized.

      Summary:
      - ignoreLocation: false → keep prioritizing early-position matches
      - distance: 1000 → allow matches anywhere in the string without discarding them
      */
      ignoreLocation: false,
      distance: 1000
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

  return (
    <>
      <SettingsPageHeader title="Address Book">
        <>
          <Search
            testID="search-contacts-input"
            placeholder={t('Search contacts')}
            autoFocus
            control={control}
            containerStyle={{ width: isWidthS ? 320 : 200 }}
          />
          <Button
            testID="add-contact-form-modal"
            text={t('Add a contact')}
            type="primary"
            size="smaller"
            textStyle={{ fontSize: 12 }}
            style={[spacings.phSm, { height: 40 }]}
            hasBottomSpacing={false}
            onPress={openAddContactForm as any}
            submitOnEnter={false}
            childrenPosition="left"
          >
            <AddCircularIcon color="#fff" width={20} height={20} style={spacings.mrMi} />
          </Button>
        </>
      </SettingsPageHeader>
      <ScrollableWrapper style={flexbox.flex1}>
        {walletAccountsSourcedContacts.length > 0 ? (
          <View style={spacings.mb2Xl}>
            <TitleAndIcon
              title={t('My wallets')}
              icon={WalletIcon}
              style={{ ...spacings.pl0, ...spacings.mbSm }}
            />
            {walletAccountsSourcedContacts.map((contact) => (
              <ContactWrapper
                key={`${contact.address}-${!contact.isWalletAccount ? 'wallet' : 'address'}`}
              >
                <AddressBookContact
                  fontSize={16}
                  height={24}
                  testID={`name-${contact.name.toLowerCase().replace(/\s+/g, '-')}`}
                  name={contact.name}
                  address={contact.address}
                  isManageable={!contact.isWalletAccount}
                  isEditable
                />
              </ContactWrapper>
            ))}
          </View>
        ) : null}
        {manuallyAddedContacts.length > 0 ? (
          <>
            <TitleAndIcon
              title={t('Contacts')}
              icon={AddressBookIcon}
              style={{ ...spacings.pl0, ...spacings.mbSm }}
            />
            {manuallyAddedContacts.map((contact) => (
              <ContactWrapper
                key={`${contact.address}-${!contact.isWalletAccount ? 'wallet' : 'address'}`}
              >
                <AddressBookContact
                  testID="contact-name-text"
                  name={contact.name}
                  address={contact.address}
                  isManageable={!contact.isWalletAccount}
                  isEditable
                />
              </ContactWrapper>
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

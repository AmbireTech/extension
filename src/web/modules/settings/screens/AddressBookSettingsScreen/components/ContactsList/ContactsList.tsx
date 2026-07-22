import React from 'react'
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
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import useContactsSearch from '@common/modules/settings/hooks/useContactsSearch'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'

import AddContactFormModal from '@common/modules/settings/components/AddContactFormModal'

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
  const { control, watch } = useForm({
    defaultValues: {
      search: ''
    }
  })

  const search = watch('search')
  const { contacts, filteredContacts, walletAccountsSourcedContacts, manuallyAddedContacts } =
    useContactsSearch(search)

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

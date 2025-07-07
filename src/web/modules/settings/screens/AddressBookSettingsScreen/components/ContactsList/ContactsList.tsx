import React from 'react'
import { useTranslation } from 'react-i18next'

import AccountsFilledIcon from '@common/assets/svg/AccountsFilledIcon'
import WalletFilledIcon from '@common/assets/svg/WalletFilledIcon'
import AddressBookContact from '@common/components/AddressBookContact'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import TitleAndIcon from '@common/components/TitleAndIcon'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'

import Section from '../Section'

const ContactsList = () => {
  const { t } = useTranslation()
  const { contacts } = useAddressBookControllerState()

  const walletAccountsSourcedContacts = contacts.filter((contact) => contact.isWalletAccount)
  const manuallyAddedContacts = contacts.filter((contact) => !contact.isWalletAccount)

  return (
    <Section title="Address Book">
      <ScrollableWrapper style={flexbox.flex1}>
        {walletAccountsSourcedContacts.length > 0 ? (
          <>
            <TitleAndIcon title={t('My wallets')} icon={WalletFilledIcon} />
            {walletAccountsSourcedContacts.map((contact) => (
              <AddressBookContact
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
                testID={`contact-name-text`}
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
      </ScrollableWrapper>
    </Section>
  )
}

export default ContactsList

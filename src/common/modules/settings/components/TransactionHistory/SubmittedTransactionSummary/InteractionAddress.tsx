import React from 'react'
import { View } from 'react-native'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import Text from '@common/components/Text'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import useReverseLookup from '@common/hooks/useReverseLookup'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

// TODO: Refactor to use the <AccountAddress /> component instead
const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts

const InteractionAddress = ({ address }: { address: string }) => {
  const { isNarrowWebLayout } = useCompactLayout()
  const reverseLookup = useReverseLookup({ address })
  const { contacts = [] } = useController('AddressBookController').state
  const { state: accounts = [] } = useController('AccountsController', selectAccounts)
  const addressBookContact = contacts.find(
    (contact) => contact.address.toLowerCase() === address.toLowerCase()
  )
  const localAccount = accounts.find(
    (account) => account.addr.toLowerCase() === address.toLowerCase()
  )
  const localLabel =
    reverseLookup.name || addressBookContact?.name || localAccount?.preferences?.label
  const truncatedLocalLabel =
    localLabel && localLabel.length > 15 ? `${localLabel.slice(0, 15)}...` : localLabel

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        isNarrowWebLayout && { flexShrink: 1, minWidth: 0 }
      ]}
    >
      {truncatedLocalLabel && (
        <Text
          fontSize={12}
          weight="medium"
          appearance="secondaryText"
          numberOfLines={isNarrowWebLayout ? 1 : undefined}
          style={[spacings.mrMi, isNarrowWebLayout && { flexShrink: 1, lineHeight: 16 }]}
        >
          {truncatedLocalLabel}
        </Text>
      )}
      <Text
        fontSize={12}
        appearance="secondaryText"
        style={isNarrowWebLayout ? { lineHeight: 16 } : undefined}
      >
        {truncatedLocalLabel ? `(${shortenAddress(address, 12)})` : shortenAddress(address, 12)}
      </Text>
    </View>
  )
}

export default React.memo(InteractionAddress)

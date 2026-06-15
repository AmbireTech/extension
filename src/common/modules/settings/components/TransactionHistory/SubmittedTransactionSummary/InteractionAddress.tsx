import React from 'react'
import { View } from 'react-native'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useReverseLookup from '@common/hooks/useReverseLookup'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

// TODO: Refactor to use the <AccountAddress /> component instead
const InteractionAddress = ({ address }: { address: string }) => {
  const reverseLookup = useReverseLookup({ address, privacyUpdateMode: 'ifMissing' })
  const { contacts = [] } = useController('AddressBookController').state
  const { accounts = [] } = useController('AccountsController').state
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
    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
      {truncatedLocalLabel && (
        <Text fontSize={12} weight="medium" appearance="secondaryText" style={spacings.mrMi}>
          {truncatedLocalLabel}
        </Text>
      )}
      <Text fontSize={12} appearance="secondaryText">
        {truncatedLocalLabel ? `(${shortenAddress(address, 12)})` : shortenAddress(address, 12)}
      </Text>
    </View>
  )
}

export default React.memo(InteractionAddress)

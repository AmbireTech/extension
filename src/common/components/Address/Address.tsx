import { getAddress } from 'ethers'
import React, { FC, useMemo } from 'react'

import { DEFAULT_ACCOUNT_LABEL } from '@ambire-common/consts/account'
import { Props as TextProps } from '@common/components/Text'
import { isExtension } from '@web/constants/browserapi'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'

import BaseAddress from './components/BaseAddress'
import { BenzinDomainsAddress, DomainsAddress } from './components/DomainsAddress'

interface Props extends TextProps {
  address: string
  // example of highestPriorityAlias: a name coming from the humanizer's metadata
  highestPriorityAlias?: string
  explorerNetworkId?: string
}

const Address: FC<Props> = ({ address, highestPriorityAlias, ...rest }) => {
  const { accounts } = useAccountsControllerState()
  const { contacts = [] } = useAddressBookControllerState()
  const checksummedAddress = useMemo(() => getAddress(address), [address])
  const account = useMemo(() => {
    if (!accounts) return undefined
    return accounts.find((a) => a.addr === checksummedAddress)
  }, [accounts, checksummedAddress])

  const contact = contacts.find((c) => c.address.toLowerCase() === address.toLowerCase())

  // highestPriorityAlias and account labels are of higher priority than domains
  if (highestPriorityAlias || contact?.name || account?.preferences?.label || DEFAULT_ACCOUNT_LABEL)
    return (
      <BaseAddress address={checksummedAddress} {...rest}>
        {highestPriorityAlias ||
          contact?.name ||
          account?.preferences?.label ||
          DEFAULT_ACCOUNT_LABEL}
      </BaseAddress>
    )

  if (!isExtension) return <BenzinDomainsAddress address={checksummedAddress} {...rest} />

  return <DomainsAddress address={checksummedAddress} {...rest} />
}

export default React.memo(Address)

import { ZeroAddress } from 'ethers'
import React, { FC, useMemo } from 'react'

import { BlacklistedStatus } from '@ambire-common/interfaces/phishing'
import { HumanizerMetaAddress } from '@ambire-common/libs/humanizer/interfaces'
import { getAddressCaught } from '@ambire-common/utils/getAddressCaught'
import { Props as TextProps } from '@common/components/Text'
import useController from '@common/hooks/useController'
import { isExtension } from '@web/constants/browserapi'

import { AddressName, BenzinAddressName } from '../AddressName'
import BaseAddress from '../BaseAddress'

interface Props extends TextProps {
  address: string
  // example of highestPriorityAlias: a name coming from the humanizer's metadata
  highestPriorityAlias?: string
  humanizerInfo?: HumanizerMetaAddress
  hideLinks?: boolean
  actionsMode?: 'tooltip' | 'inline'
  chainId: bigint
  verification?: BlacklistedStatus
}

const HumanizerAddressInner: FC<Props> = ({
  humanizerInfo,
  address,
  highestPriorityAlias,
  hideLinks = false,
  actionsMode = 'tooltip',
  chainId,
  ...rest
}) => {
  const {
    state: { portfolio }
  } = useController('SelectedAccountController')
  const accountsState = useController('AccountsController').state
  const { contacts = [] } = useController('AddressBookController').state
  const checksummedAddress = getAddressCaught(address)

  const localAddressLabel = useMemo(() => {
    const zeroAddressLabel = address === ZeroAddress && 'Zero Address'
    const contact = contacts.find((c) => c.address.toLowerCase() === address.toLowerCase())
    const account =
      accountsState?.accounts && accountsState.accounts.find((a) => a.addr === checksummedAddress)
    const hardcodedName = humanizerInfo?.name
    const tokenSymbol =
      portfolio?.tokens?.find((token) => token.address.toLowerCase() === address.toLowerCase())
        ?.symbol || humanizerInfo?.token?.symbol
    return (
      highestPriorityAlias ||
      zeroAddressLabel ||
      contact?.name ||
      account?.preferences?.label ||
      hardcodedName ||
      tokenSymbol
    )
  }, [
    highestPriorityAlias,
    contacts,
    humanizerInfo?.name,
    humanizerInfo?.token?.symbol,
    portfolio?.tokens,
    address,
    checksummedAddress,
    accountsState?.accounts
  ])

  if (actionsMode === 'inline') {
    if (!isExtension)
      return (
        <BenzinAddressName
          address={checksummedAddress}
          chainId={chainId}
          actionsMode={actionsMode}
          fallbackLabel={localAddressLabel || undefined}
          hideLinks={hideLinks}
          {...rest}
        />
      )

    return (
      <AddressName
        address={checksummedAddress}
        chainId={chainId}
        actionsMode={actionsMode}
        fallbackLabel={localAddressLabel || undefined}
        hideLinks={hideLinks}
        {...rest}
      />
    )
  }

  // highestPriorityAlias and account labels are of higher priority than domains outside inline mode.
  if (localAddressLabel)
    return (
      <BaseAddress
        address={checksummedAddress}
        hideLinks={hideLinks}
        actionsMode={actionsMode}
        chainId={chainId}
        {...rest}
      >
        {localAddressLabel}
      </BaseAddress>
    )

  if (!isExtension)
    return (
      <BenzinAddressName
        address={checksummedAddress}
        chainId={chainId}
        actionsMode={actionsMode}
        {...rest}
      />
    )

  return (
    <AddressName
      address={checksummedAddress}
      chainId={chainId}
      actionsMode={actionsMode}
      {...rest}
    />
  )
}

export default React.memo(HumanizerAddressInner)

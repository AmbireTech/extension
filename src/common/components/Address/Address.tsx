import { getAddress } from 'ethers'
import React, { FC, useMemo } from 'react'

import humanizerInfo from '@ambire-common/consts/humanizer/humanizerInfo.json'
import { HumanizerMeta } from '@ambire-common/libs/humanizer/interfaces'
import { Props as TextProps } from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { isExtension } from '@web/constants/browserapi'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'

import BaseAddress from './components/BaseAddress'
import { BenzinDomainsAddress, DomainsAddress } from './components/DomainsAddress'

interface Props extends TextProps {
  address: string
  // example of highestPriorityAlias: a name coming from the humanizer's metadata
  highestPriorityAlias?: string
  explorerNetworkId?: string
}
const HUMANIZER_META = humanizerInfo as HumanizerMeta

const Address: FC<Props> = ({ address, highestPriorityAlias, ...rest }) => {
  const { accountPortfolio } = usePortfolioControllerState()
  const accountsState = useAccountsControllerState()
  const { t } = useTranslation()
  const { contacts = [] } = useAddressBookControllerState()
  const checksummedAddress = useMemo(() => getAddress(address), [address])

  const account = useMemo(() => {
    if (!accountsState?.accounts) return undefined
    return accountsState.accounts.find((a) => a.addr === checksummedAddress)
  }, [accountsState?.accounts, checksummedAddress])
  const tokenInPortfolio = useMemo(() => {
    if (!accountPortfolio?.tokens) return undefined
    return accountPortfolio.tokens.find((t) => t.address.toLowerCase() === address.toLowerCase())
  }, [accountPortfolio?.tokens, checksummedAddress])

  const isRecipientHumanizerKnownTokenOrSmartContract = !!HUMANIZER_META.knownAddresses[address.toLowerCase()]?.isSC 
  let tokenLabel = ''
          
  if (tokenInPortfolio) {
    tokenLabel = `Token ${tokenInPortfolio?.symbol} Contract`
  } else if (isRecipientHumanizerKnownTokenOrSmartContract) {
    const humanizerToken = HUMANIZER_META?.knownAddresses[address.toLowerCase()]?.token
    tokenLabel = t(`Token ${humanizerToken?.symbol} Contract`)
  }

  const contact = contacts.find((c) => c.address.toLowerCase() === address.toLowerCase())

  // highestPriorityAlias and account labels are of higher priority than domains
  if (highestPriorityAlias || contact?.name || account?.preferences?.label || tokenLabel)
    return (
      <BaseAddress address={checksummedAddress} {...rest}>
        {highestPriorityAlias || contact?.name || account?.preferences?.label || tokenLabel}
      </BaseAddress>
    )

  if (!isExtension) return <BenzinDomainsAddress address={checksummedAddress} {...rest} />

  return <DomainsAddress address={checksummedAddress} {...rest} />
}

export default React.memo(Address)

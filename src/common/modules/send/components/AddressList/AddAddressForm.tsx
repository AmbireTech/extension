import { Address } from 'ambire-common/src/hooks/useAddressBook'
import { isKnownTokenOrContract, isValidAddress } from 'ambire-common/src/services/address'
import { getBip44Items, resolveENSDomain } from 'ambire-common/src/services/ensDomains'
import { resolveUDomain } from 'ambire-common/src/services/unstoppableDomains'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Input from '@common/components/Input'
import RecipientInput from '@common/components/RecipientInput'
import Title from '@common/components/Title'
import { useTranslation } from '@common/config/localization'
import useAddressBook from '@common/hooks/useAddressBook'
import useConstants from '@common/hooks/useConstants'
import useNetwork from '@common/hooks/useNetwork'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

interface Props {
  onSubmit: ({
    name,
    address,
    type
  }: {
    name: Address['name']
    address: Address['address']
    type: Address['type']
  }) => void
  address: string
  uDAddr: string
  ensAddr: string
}

const AddAddressForm = ({ onSubmit, address, uDAddr, ensAddr }: Props) => {
  const { t } = useTranslation()
  const [addrName, setAddrName] = useState<string>('')
  const [addr, setAddr] = useState<string>('')
  const [uDAddress, setUDAddress] = useState<string>('')
  const [ensAddress, setEnsAddress] = useState<string>('')
  const { constants } = useConstants()

  const { isKnownAddress } = useAddressBook()

  const parsedAddr = uDAddr || ensAddr || address || ''

  const unknownWarning = useMemo(() => {
    if (uDAddress || uDAddr || ensAddress || ensAddr) {
      return !isKnownAddress(address)
    }
    return isValidAddress(address) && !isKnownAddress(address)
  }, [address, uDAddress, isKnownAddress, uDAddr, ensAddress, ensAddr])

  const smartContractWarning = useMemo(
    () => isKnownTokenOrContract(constants!.humanizerInfo, parsedAddr),
    [parsedAddr, constants]
  )

  const timer: any = useRef(null)
  const checkedIsUDAddress: any = useRef(false)
  const { network }: any = useNetwork()

  useEffect(() => {
    ;(async () => {
      if (address && !smartContractWarning && !!unknownWarning) {
        setAddr(address)
        setUDAddress(uDAddr)
        checkedIsUDAddress.current = true
      }
    })()
  }, [address, uDAddr, smartContractWarning, unknownWarning])

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current)
    }

    const validate = async () => {
      const uDAddr = await resolveUDomain(addr, null, network.unstoppableDomainsChain)
      const bip44Item = getBip44Items(null)
      const ensAddr = await resolveENSDomain(addr, bip44Item)
      timer.current = null
      setUDAddress(uDAddr || '')
      setEnsAddress(ensAddr || '')
      checkedIsUDAddress.current = true
    }

    timer.current = setTimeout(async () => {
      return validate()
    }, 300)
  }, [addr, network.unstoppableDomainsChain])

  const onAddrNameChange = (value: string) => {
    setAddrName(value)
  }

  const onAddrChange = (value: string) => {
    setAddr(value)
  }

  const handleSubmit = () => {
    onSubmit({
      name: addrName,
      address: addr,
      type: uDAddress ? 'ud' : ensAddress ? 'ens' : 'pub'
    })
  }

  return (
    <>
      <View style={[spacings.mbSm, flexboxStyles.alignCenter]}>
        <Title>{t('Add New Address')}</Title>
      </View>

      <Input
        containerStyle={spacings.mbTy}
        placeholder={t('Address Name')}
        onChangeText={onAddrNameChange}
      />

      <RecipientInput
        onChangeText={onAddrChange}
        isValidUDomain={!!uDAddress}
        isValidEns={!!ensAddress}
        containerStyle={spacings.mbTy}
        placeholder={t('Address / UDⓇ / ENSⓇ domain')}
        isValid={!!uDAddress || !!ensAddress}
        error={
          checkedIsUDAddress.current &&
          !!addr &&
          !isValidAddress(uDAddress || ensAddress || addr) &&
          (t('Invalid address.') as string)
        }
        value={addr}
      />

      <Button
        onPress={handleSubmit}
        type="outline"
        text={t('Add Address')}
        disabled={!addrName || !isValidAddress(uDAddress || ensAddress || addr)}
      />
    </>
  )
}

export default AddAddressForm

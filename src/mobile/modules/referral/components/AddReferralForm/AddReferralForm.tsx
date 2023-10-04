import { Address } from 'ambire-common/src/hooks/useAddressBook'
import { isValidAddress } from 'ambire-common/src/services/address'
import { getBip44Items, resolveENSDomain } from 'ambire-common/src/services/ensDomains'
import { resolveUDomain } from 'ambire-common/src/services/unstoppableDomains'
import React, { useEffect, useRef, useState } from 'react'

import Button from '@common/components/Button'
import RecipientInput from '@common/components/RecipientInput'
import { useTranslation } from '@common/config/localization'
import useNetwork from '@common/hooks/useNetwork'
import spacings from '@common/styles/spacings'

type ISODateString = string

export type AddReferralFormValues = {
  // Can be a UD domain, ENS domain or a public address.
  address: Address['address']
  type: Address['type']
  hexAddress: Address['address']
  submittedAt: ISODateString
}

interface Props {
  initialValue: string
  onSubmit: (values: AddReferralFormValues) => void
}

const AddReferralForm = ({ onSubmit, initialValue }: Props) => {
  const { t } = useTranslation()
  const [addr, setAddr] = useState<string>(initialValue || '')
  const [uDAddress, setUDAddress] = useState<string>('')
  const [ensAddress, setEnsAddress] = useState<string>('')

  const timer: any = useRef(null)
  const checkedIsUDAddress: any = useRef(false)
  const { network }: any = useNetwork()

  // TODO: Duplicated logic. Consider moving it and re-using it in the RecipientInput.
  useEffect(() => {
    ;(async () => {
      if (addr) {
        checkedIsUDAddress.current = true
      }
    })()
  }, [addr, uDAddress])

  // TODO: Duplicated logic. Consider moving it and re-using it in the RecipientInput.
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

  const handleSubmit = () => {
    onSubmit({
      address: addr,
      type: uDAddress ? 'ud' : ensAddress ? 'ens' : 'pub',
      hexAddress: uDAddress || ensAddress || addr,
      submittedAt: new Date().toISOString()
    })
  }

  return (
    <>
      <RecipientInput
        onChangeText={setAddr}
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
        style={spacings.mtTy}
        onPress={handleSubmit}
        text={t('Submit')}
        disabled={!addr || !isValidAddress(uDAddress || ensAddress || addr)}
      />
    </>
  )
}

export default AddReferralForm

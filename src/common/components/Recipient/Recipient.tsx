import { Address } from 'ambire-common/src/hooks/useAddressBook'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, TouchableOpacity, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import Input, { InputProps } from '@common/components/Input'
import useAddressBook from '@common/hooks/useAddressBook'
import AddressList from '@common/modules/send/components/AddressList'
import AddAddressForm from '@common/modules/send/components/AddressList/AddAddressForm'
import ConfirmAddress from '@common/modules/send/components/ConfirmAddress'
import spacings from '@common/styles/spacings'

import BottomSheet from '../BottomSheet'
import NavIconWrapper from '../NavIconWrapper'
import RecipientInput from '../RecipientInput'

interface Props extends InputProps {
  setAddress: (text: string) => void
  address: string
  uDAddress: string
  ensAddress: string
  addressValidationMsg: string
  setAddressConfirmed: React.Dispatch<React.SetStateAction<boolean>>
  addressConfirmed: boolean
}

const Recipient: React.FC<Props> = ({
  setAddress,
  address,
  uDAddress,
  ensAddress,
  addressValidationMsg,
  setAddressConfirmed,
  addressConfirmed
}) => {
  const { t } = useTranslation()
  const { addAddress } = useAddressBook()
  const {
    ref: sheetRefAddrAdd,
    open: openBottomSheetAddrAdd,
    close: closeBottomSheetAddrAdd
  } = useModalize()
  const {
    ref: sheetRefAddrDisplay,
    open: openBottomSheetAddrDisplay,
    close: closeBottomSheetAddrDisplay
  } = useModalize()

  const handleAddNewAddress = (fieldValues: Address) => {
    addAddress(fieldValues.name, fieldValues.address, fieldValues.type)
    closeBottomSheetAddrAdd()
    openBottomSheetAddrDisplay()
  }

  return (
    <>
      <RecipientInput
        containerStyle={spacings.mb}
        isValidUDomain={!!uDAddress}
        isValidEns={!!ensAddress}
        placeholder={t('Recipient')}
        info={t(
          'Please double-check the recipient address, blockchain transactions are not reversible.'
        )}
        isValid={address.length > 1 && !addressValidationMsg && (!!uDAddress || !!ensAddress)}
        error={address.length > 1 && addressValidationMsg}
        value={address}
        onChangeText={setAddress}
      />

      <ConfirmAddress
        address={address}
        uDAddress={uDAddress}
        ensAddress={ensAddress}
        addressConfirmed={addressConfirmed}
        setAddressConfirmed={setAddressConfirmed}
        onAddToAddressBook={openBottomSheetAddrAdd}
      />

      <TouchableOpacity
        onPress={() => {
          Keyboard.dismiss()
          openBottomSheetAddrDisplay()
        }}
      >
        <View pointerEvents="none">
          <Input
            value={t('Address Book')}
            containerStyle={spacings.mbSm}
            button={
              <NavIconWrapper onPress={() => null}>
                <DownArrowIcon width={34} height={34} />
              </NavIconWrapper>
            }
          />
        </View>
      </TouchableOpacity>

      <BottomSheet
        id="addresses-list"
        sheetRef={sheetRefAddrDisplay}
        closeBottomSheet={closeBottomSheetAddrDisplay}
      >
        <AddressList
          onSelectAddress={(item): any => setAddress(item.address)}
          onCloseBottomSheet={closeBottomSheetAddrDisplay}
          onOpenBottomSheet={openBottomSheetAddrAdd}
        />
      </BottomSheet>
      <BottomSheet
        id="add-address"
        sheetRef={sheetRefAddrAdd}
        closeBottomSheet={closeBottomSheetAddrAdd}
      >
        <AddAddressForm
          onSubmit={handleAddNewAddress}
          address={address}
          uDAddr={uDAddress}
          ensAddr={ensAddress}
        />
      </BottomSheet>
    </>
  )
}

export default React.memo(Recipient)

import React from 'react'
import { FieldValues, SubmitHandler } from 'react-hook-form'
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View
} from 'react-native'

import { useTranslation } from '@config/localization'
import BottomSheet from '@modules/common/components/BottomSheet'
import useBottomSheet from '@modules/common/components/BottomSheet/hooks/useBottomSheet'
import Button from '@modules/common/components/Button'
import Input from '@modules/common/components/Input'
import NumberInput from '@modules/common/components/NumberInput'
import P from '@modules/common/components/P'
import Panel from '@modules/common/components/Panel'
import Select from '@modules/common/components/Select'
import Title from '@modules/common/components/Title'
import Wrapper from '@modules/common/components/Wrapper'
import useAddressBook from '@modules/common/hooks/useAddressBook'
import AddressList from '@modules/send/components/AddressList'
import AddAddressForm from '@modules/send/components/AddressList/AddAddressForm'
import ConfirmAddress from '@modules/send/components/ConfirmAddress'
import useRequestTransaction from '@modules/send/hooks/useRequestTransaction'

const SendScreen = () => {
  const { t } = useTranslation()
  const { sheetRef, openBottomSheet, closeBottomSheet } = useBottomSheet()
  const { addAddress } = useAddressBook()
  const {
    asset,
    amount,
    address,
    assetsItems,
    setAsset,
    onAmountChange,
    setMaxAmount,
    setAddress,
    sendTransaction,
    isBalanceLoading,
    disabled,
    addressConfirmed,
    setAddressConfirmed,
    validationFormMgs,
    unknownWarning,
    smartContractWarning
  } = useRequestTransaction()

  const handleAddNewAddress = (fieldValues: SubmitHandler<FieldValues>) => {
    // @ts-ignore
    addAddress(fieldValues.name, fieldValues.address)
    closeBottomSheet()
  }

  return (
    <Wrapper>
      {isBalanceLoading && (
        <View style={StyleSheet.absoluteFill}>
          <ActivityIndicator style={StyleSheet.absoluteFill} size="large" />
        </View>
      )}
      {!isBalanceLoading && (
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss()
          }}
        >
          <>
            {assetsItems.length ? (
              <Panel>
                <Title>{t('Send')}</Title>
                <Select value={asset} items={assetsItems} setValue={setAsset} />
                <NumberInput
                  onChangeText={onAmountChange}
                  value={amount.toString()}
                  buttonText={t('MAX')}
                  onButtonPress={setMaxAmount}
                />
                {!!validationFormMgs.messages?.amount && <P>{validationFormMgs.messages.amount}</P>}
                <Input
                  placeholder={t('Recipient')}
                  info={t(
                    'Please double-check the recipient address, blockchain transactions are not reversible.'
                  )}
                  value={address}
                  onChangeText={setAddress}
                />
                {!!validationFormMgs.messages?.address && (
                  <P>{validationFormMgs.messages.address}</P>
                )}
                {!smartContractWarning && !!unknownWarning && (
                  <ConfirmAddress
                    addressConfirmed={addressConfirmed}
                    setAddressConfirmed={setAddressConfirmed}
                    onAddToAddressBook={openBottomSheet}
                  />
                )}
                <Button
                  text={t('Send')}
                  disabled={disabled}
                  onPress={() => {
                    Keyboard.dismiss()
                    sendTransaction()
                  }}
                />
              </Panel>
            ) : (
              <P>{t("You don't have any funds on this account.")}</P>
            )}
            <AddressList
              onSelectAddress={(item): any => setAddress(item.address)}
              onOpenBottomSheet={openBottomSheet}
            />
          </>
        </TouchableWithoutFeedback>
      )}
      <BottomSheet
        sheetRef={sheetRef}
        maxInitialHeightPercentage={1}
        onCloseEnd={() => {
          Keyboard.dismiss()
        }}
      >
        <AddAddressForm
          onSubmit={handleAddNewAddress}
          address={!smartContractWarning && !!unknownWarning && !!address ? address : ''}
        />
      </BottomSheet>
    </Wrapper>
  )
}

export default SendScreen

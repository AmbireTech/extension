import React, { useCallback } from 'react'
import { Keyboard, StyleSheet, View } from 'react-native'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Spinner from '@common/components/Spinner'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import { isiOS } from '@common/config/env'
import SendForm from '@common/modules/send/components/SendForm'
import useRequestTransaction from '@common/modules/send/hooks/useRequestTransaction'
import flexboxStyles from '@common/styles/utils/flexbox'

const SendScreen = () => {
  const {
    asset,
    amount,
    address,
    assetsItems,
    setAsset,
    selectedAsset,
    onAmountChange,
    maxAmount,
    setMaxAmount,
    setAddress,
    sendTransaction,
    disabled,
    addressConfirmed,
    setAddressConfirmed,
    validationFormMgs,
    showSWAddressWarning,
    sWAddressConfirmed,
    setSWAddressConfirmed,
    uDAddress,
    ensAddress,
    isLoading
  } = useRequestTransaction()

  const handleSend = useCallback(() => {
    Keyboard.dismiss()
    sendTransaction()
  }, [sendTransaction])

  return (
    <GradientBackgroundWrapper>
      <Wrapper
        keyboardDismissMode="on-drag"
        type={isiOS ? WRAPPER_TYPES.KEYBOARD_AWARE_SCROLL_VIEW : WRAPPER_TYPES.SCROLL_VIEW}
      >
        {isLoading && (
          <View
            style={[
              StyleSheet.absoluteFill,
              flexboxStyles.alignCenter,
              flexboxStyles.justifyCenter
            ]}
          >
            <Spinner />
          </View>
        )}

        <SendForm
          isHidden={isLoading}
          asset={asset}
          address={address}
          amount={amount}
          assetsItems={assetsItems}
          maxAmount={maxAmount}
          selectedAsset={selectedAsset}
          disabled={disabled}
          addressConfirmed={addressConfirmed}
          uDAddress={uDAddress}
          ensAddress={ensAddress}
          sWAddressConfirmed={sWAddressConfirmed}
          showSWAddressWarning={showSWAddressWarning}
          validationFormMgs={validationFormMgs}
          onSendPress={handleSend}
          setAsset={setAsset}
          onAmountChange={onAmountChange}
          setMaxAmount={setMaxAmount}
          setAddress={setAddress}
          setAddressConfirmed={setAddressConfirmed}
          setSWAddressConfirmed={setSWAddressConfirmed}
        />
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default SendScreen

import React from 'react'
import { useTranslation } from 'react-i18next'

import BottomSheet from '@modules/common/components/BottomSheet'
import useBottomSheet from '@modules/common/components/BottomSheet/hooks/useBottomSheet'
import Button from '@modules/common/components/Button'
import Text from '@modules/common/components/Text'
import TextWarning from '@modules/common/components/TextWarning'
import Title from '@modules/common/components/Title'
import spacings from '@modules/common/styles/spacings'
import textStyles from '@modules/common/styles/utils/text'
import HardwareWalletSelectConnection from '@modules/hardware-wallet/components/HardwareWalletSelectConnection'
import useHardwareWalletActions from '@modules/hardware-wallet/hooks/useHardwareWalletActions'

const AddHardwareWalletSigner = () => {
  const { t } = useTranslation()
  const { sheetRef, openBottomSheet, closeBottomSheet, isOpen } = useBottomSheet()
  const { addSigner } = useHardwareWalletActions()

  const handleOnSelectDevice = async (device: any) => {
    await addSigner(device)
    closeBottomSheet()
  }

  return (
    <>
      <Title hasBottomSpacing={false} style={[spacings.mbTy, spacings.mtTy, textStyles.center]}>
        {t('Add new hardware wallet signer')}
      </Title>
      <Button text={t('Add Signer')} onPress={openBottomSheet} style={spacings.mbLg} />
      <TextWarning appearance="info">
        {t('For accessing the full signers management options, please visit the web app.')}
      </TextWarning>
      <BottomSheet
        id="hardware-wallet-signer"
        sheetRef={sheetRef}
        isOpen={isOpen}
        closeBottomSheet={closeBottomSheet}
        dynamicInitialHeight={false}
      >
        <HardwareWalletSelectConnection onSelectDevice={handleOnSelectDevice} shouldWrap={false} />
      </BottomSheet>
    </>
  )
}

export default AddHardwareWalletSigner

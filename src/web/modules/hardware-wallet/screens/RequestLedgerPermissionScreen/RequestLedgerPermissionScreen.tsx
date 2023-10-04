import React from 'react'

import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import Wrapper from '@common/components/Wrapper'
import useNavigation from '@common/hooks/useNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import TransportWebHID from '@ledgerhq/hw-transport-webhid'
import { HARDWARE_WALLETS } from '@web/modules/hardware-wallet/constants/common'
import useHardwareWallets from '@web/modules/hardware-wallet/hooks/useHardwareWallets'

const RequestLedgerPermissionScreen = () => {
  const { navigate } = useNavigation()
  const { hardwareWallets } = useHardwareWallets()

  const onSubmit = async () => {
    try {
      const transport = await TransportWebHID.create()
      await transport.close()
      await hardwareWallets[HARDWARE_WALLETS.LEDGER].authorizeHIDPermission()

      navigate(WEB_ROUTES.accountsImporter, {
        state: {
          walletType: HARDWARE_WALLETS.LEDGER,
          isWebHID: true
        }
      })
    } catch (e) {}
  }

  return (
    <GradientBackgroundWrapper>
      <Wrapper>
        <Title>Allow Ambire permissions to:</Title>
        <Text>Connect to an HID device</Text>
        <Text>
          Please click "Allow" below and authorize access to your Ledger in the following pop-up
          window.
        </Text>
        <Button text="Allow" onPress={onSubmit} />
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default RequestLedgerPermissionScreen

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
import { hasConnectedLedgerDevice } from '@web/modules/hardware-wallet/utils/ledger'

const ConnectLedgerScreen = () => {
  const { navigate } = useNavigation()

  const onSubmit = async () => {
    const supportWebHID = await TransportWebHID.isSupported()
    const hasConnectedLedger = await hasConnectedLedgerDevice()

    if (!supportWebHID) {
      navigate(WEB_ROUTES.accountsImporter, {
        state: {
          walletType: HARDWARE_WALLETS.LEDGER,
          isWebHID: false
        }
      })
    } else if (hasConnectedLedger) {
      navigate(WEB_ROUTES.accountsImporter, {
        state: {
          walletType: HARDWARE_WALLETS.LEDGER,
          isWebHID: true
        }
      })
    } else {
      navigate(WEB_ROUTES.hardwareWalletLedgerPermission)
    }
  }

  return (
    <GradientBackgroundWrapper>
      <Wrapper>
        <Title>Connect Ledger</Title>
        <Text>1. Plug your Ledger wallet into your computer</Text>
        <Text>2. Unlock Ledger and open the Ethereum app</Text>
        <Button text="Next" onPress={onSubmit} />
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default ConnectLedgerScreen

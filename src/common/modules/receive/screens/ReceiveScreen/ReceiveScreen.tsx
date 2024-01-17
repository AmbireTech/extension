import React from 'react'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Wrapper from '@common/components/Wrapper'
import useAccounts from '@common/hooks/useAccounts'
import useNetwork from '@common/hooks/useNetwork'
import DepositFiat from '@common/modules/receive/components/DepositFiat'
import DepositTokens from '@common/modules/receive/components/DepositTokens'

const ReceiveScreen = () => {
  const { selectedAcc } = useAccounts()
  const { network } = useNetwork()

  return (
    <GradientBackgroundWrapper>
      <Wrapper hasBottomTabNav={false}>
        <DepositTokens selectedAcc={selectedAcc} networkId={network?.id} />
        <DepositFiat selectedAcc={selectedAcc} network={network} />
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default ReceiveScreen

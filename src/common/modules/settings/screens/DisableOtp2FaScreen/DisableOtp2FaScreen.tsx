import React from 'react'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Wrapper from '@common/components/Wrapper'
import DisableOTP2FaForm from '@common/modules/settings/components/DisableOTP2FaForm'
import spacings from '@common/styles/spacings'

const DisableOtp2FaScreen = () => {
  return (
    <GradientBackgroundWrapper>
      <Wrapper style={spacings.mt}>
        <DisableOTP2FaForm />
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default DisableOtp2FaScreen

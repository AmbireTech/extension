import React from 'react'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import EnableOTP2FaForm from '@common/modules/settings/components/EnableOTP2FaForm'
import spacings from '@common/styles/spacings'

const EnableOtp2FaScreen = () => {
  return (
    <GradientBackgroundWrapper>
      <Wrapper
        style={spacings.mt}
        type={WRAPPER_TYPES.KEYBOARD_AWARE_SCROLL_VIEW}
        extraHeight={220}
      >
        <EnableOTP2FaForm />
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default EnableOtp2FaScreen

import React from 'react'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Text from '@common/components/Text'
import Wrapper from '@common/components/Wrapper'
import spacings from '@common/styles/spacings'
import useApproval from '@web/hooks/useApproval'

const SignMessageScreen = () => {
  const { approval } = useApproval()

  console.log('sign message approval: ', approval)
  return (
    <GradientBackgroundWrapper>
      <Wrapper hasBottomTabNav={false} contentContainerStyle={spacings.pt0}>
        <Text>Sign Message Screen</Text>
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default React.memo(SignMessageScreen)

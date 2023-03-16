import React from 'react'
import { View } from 'react-native'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Spinner from '@common/components/Spinner'
import Wrapper from '@common/components/Wrapper'
import useAccounts from '@common/hooks/useAccounts'
import useNetwork from '@common/hooks/useNetwork'
import usePortfolio from '@common/hooks/usePortfolio'
import useRequests from '@common/hooks/useRequests'
import useToast from '@common/hooks/useToast'
import AAVECard from '@common/modules/earn/components/AAVECard'
import AmbireCard from '@common/modules/earn/components/AmbireCard'
// import YearnTesseractCard from '@mobile/earn/components/YearnTesseractCard'
import { CardsVisibilityProvider } from '@common/modules/earn/contexts/cardsVisibilityContext'
import flexboxStyles from '@common/styles/utils/flexbox'

const EarnScreen = () => {
  const { isCurrNetworkBalanceLoading, tokens } = usePortfolio()
  const { network } = useNetwork()
  const { selectedAcc } = useAccounts()
  const { addRequest } = useRequests()
  const { addToast } = useToast()
  return (
    <GradientBackgroundWrapper>
      <Wrapper hasBottomTabNav>
        {!!isCurrNetworkBalanceLoading && (
          <View
            style={[flexboxStyles.flex1, flexboxStyles.alignCenter, flexboxStyles.justifyCenter]}
          >
            <Spinner />
          </View>
        )}
        {!isCurrNetworkBalanceLoading && (
          <CardsVisibilityProvider>
            <>
              <AmbireCard
                tokens={tokens}
                networkId={network?.id}
                selectedAcc={selectedAcc}
                addRequest={addRequest}
              />
              <AAVECard
                tokens={tokens}
                networkId={network?.id}
                selectedAcc={selectedAcc}
                addRequest={addRequest}
                addToast={addToast}
              />
              {/* Temporarily disabled, because the lib stopped working on mobile */}
              {/* and it is even causing a crash on the browser extension */}
              {/* FIXME: https://github.com/AmbireTech/ambire-mobile-wallet/pull/774 */}
              {/* <YearnTesseractCard
                tokens={tokens}
                networkId={network?.id}
                selectedAcc={selectedAcc}
                addRequest={addRequest}
                addToast={addToast}
              /> */}
            </>
          </CardsVisibilityProvider>
        )}
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default EarnScreen

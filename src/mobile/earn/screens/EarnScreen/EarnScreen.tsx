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
import flexboxStyles from '@common/styles/utils/flexbox'
import AAVECard from '@mobile/earn/components/AAVECard'
import AmbireCard from '@mobile/earn/components/AmbireCard'
// import YearnTesseractCard from '@mobile/earn/components/YearnTesseractCard'
import { CardsVisibilityProvider } from '@mobile/earn/contexts/cardsVisibilityContext'

const EarnScreen = () => {
  const { isCurrNetworkBalanceLoading, tokens, protocols, dataLoaded } = usePortfolio()
  const { network } = useNetwork()
  const { selectedAcc } = useAccounts()
  const { addRequest } = useRequests()
  const { addToast } = useToast()
  return (
    <GradientBackgroundWrapper>
      <Wrapper hasBottomTabNav>
        {!!isCurrNetworkBalanceLoading && !dataLoaded && (
          <View
            style={[flexboxStyles.flex1, flexboxStyles.alignCenter, flexboxStyles.justifyCenter]}
          >
            <Spinner />
          </View>
        )}
        {!(!!isCurrNetworkBalanceLoading && !dataLoaded) && (
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
                protocols={protocols}
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

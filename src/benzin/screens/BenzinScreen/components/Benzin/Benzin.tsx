import { randomBytes } from 'ethers'
import React, { useMemo } from 'react'
import { ImageBackground, ScrollView, View } from 'react-native'

import { extraNetworks, networks as constantNetworks } from '@ambire-common/consts/networks'
// @ts-ignore
import meshGradientLarge from '@benzin/assets/images/mesh-gradient-large.png'
// @ts-ignore
import meshGradient from '@benzin/assets/images/mesh-gradient.png'
import Buttons from '@benzin/screens/BenzinScreen/components/Buttons'
import Header from '@benzin/screens/BenzinScreen/components/Header'
import Steps from '@benzin/screens/BenzinScreen/components/Steps'
import useBenzin from '@benzin/screens/BenzinScreen/hooks/useBenzin'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import TransactionSummary from '@web/modules/sign-account-op/components/TransactionSummary'

import { IS_MOBILE_UP_BENZIN_BREAKPOINT } from '../../styles'
import getStyles from './styles'

const Benzin = ({ state }: { state: ReturnType<typeof useBenzin> }) => {
  const { styles } = useTheme(getStyles)
  const { maxWidthSize } = useWindowSize()
  const { networks: stateNetworks } = useNetworksControllerState()
  const networks = useMemo(
    () => stateNetworks ?? [...constantNetworks, ...extraNetworks],
    [stateNetworks]
  )

  if (!state || !state.network)
    return (
      <View style={[spacings.pv, spacings.ph, flexbox.center, flexbox.flex1]}>
        <Text fontSize={24} style={spacings.mbMi} weight="semiBold">
          Error loading transaction
        </Text>
        <Text fontSize={16}>
          Invalid url params. Make sure{' '}
          <Text fontSize={16} weight="medium">
            networkId and txnId/userOpHash
          </Text>{' '}
          are provided.
        </Text>
      </View>
    )

  const {
    activeStep,
    network,
    txnId,
    userOpHash,
    stepsState,
    isRenderedInternally,
    handleCopyText,
    handleOpenExplorer,
    showCopyBtn,
    showOpenExplorerBtn
  } = state

  const calls = stepsState.calls
  const summary = useMemo(() => {
    if (!calls) return []

    return calls.map((call, i) => (
      <TransactionSummary
        key={call.data + randomBytes(6)}
        style={i !== calls.length! - 1 ? spacings.mbSm : {}}
        call={call}
        network={network}
        rightIcon={
          <OpenIcon
            width={IS_MOBILE_UP_BENZIN_BREAKPOINT ? 20 : 14}
            height={IS_MOBILE_UP_BENZIN_BREAKPOINT ? 20 : 14}
          />
        }
        onRightIconPress={handleOpenExplorer}
        size={IS_MOBILE_UP_BENZIN_BREAKPOINT ? 'lg' : 'sm'}
        networks={networks}
      />
    ))
  }, [calls, handleOpenExplorer, network, networks])

  return (
    <ImageBackground
      style={styles.backgroundImage}
      source={maxWidthSize('xl') ? meshGradientLarge : meshGradient}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Header activeStep={activeStep} network={network} stepsState={stepsState} />
          <Steps
            activeStep={activeStep}
            network={network}
            txnId={txnId}
            userOpHash={userOpHash}
            stepsState={stepsState}
            summary={summary}
          />
          {!isRenderedInternally && (
            <Buttons
              handleCopyText={handleCopyText}
              handleOpenExplorer={handleOpenExplorer}
              showCopyBtn={showCopyBtn}
              showOpenExplorerBtn={showOpenExplorerBtn}
            />
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  )
}

export default Benzin

import { randomBytes } from 'ethers'
import React, { memo, useMemo } from 'react'
import { Image, ScrollView, View } from 'react-native'

// @ts-ignore
import meshGradientLarge from '@benzin/assets/images/mesh-gradient-large.png'
// @ts-ignore
import meshGradient from '@benzin/assets/images/mesh-gradient.png'
import Buttons from '@benzin/screens/BenzinScreen/components/Buttons'
import Header from '@benzin/screens/BenzinScreen/components/Header'
import Steps from '@benzin/screens/BenzinScreen/components/Steps'
import useBenzin from '@benzin/screens/BenzinScreen/hooks/useBenzin'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import TransactionSummary from '@web/modules/sign-account-op/components/TransactionSummary'

import { IS_MOBILE_UP_BENZIN_BREAKPOINT } from '../../styles'
import getStyles from './styles'

const Benzin = ({ state }: { state: ReturnType<typeof useBenzin> }) => {
  const { styles } = useTheme(getStyles)
  const { maxWidthSize } = useWindowSize()

  const summary = useMemo(() => {
    const calls = state?.stepsState?.calls
    if (!calls || !state.network?.chainId) return []

    return calls.map((call, i) => (
      <TransactionSummary
        key={call.data + randomBytes(6)}
        style={i !== calls.length! - 1 ? spacings.mbSm : {}}
        call={call}
        chainId={state.network!.chainId}
        rightIcon={
          <OpenIcon
            width={IS_MOBILE_UP_BENZIN_BREAKPOINT ? 20 : 14}
            height={IS_MOBILE_UP_BENZIN_BREAKPOINT ? 20 : 14}
          />
        }
        onRightIconPress={state?.handleOpenExplorer}
        size={IS_MOBILE_UP_BENZIN_BREAKPOINT ? 'lg' : 'sm'}
        isHistory
      />
    ))
    // Prevents unnecessary re-renders of the humanizer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.handleOpenExplorer, state?.network?.chainId, state?.stepsState?.calls?.length])

  if (state && !state?.isInitialized)
    return (
      <View style={[spacings.pv, spacings.ph, flexbox.center, flexbox.flex1]}>
        <Spinner />
      </View>
    )

  if (!state || !state.network) {
    if (state?.isNetworkNotFound) {
      return (
        <View style={[spacings.pv, spacings.ph, flexbox.center, flexbox.flex1]}>
          <Text fontSize={24} style={spacings.mbMi} weight="semiBold">
            Network not supported
          </Text>
          <Text fontSize={16}>
            The network with chainId{' '}
            <Text fontSize={16} weight="medium">
              {state.bigintChainId.toString()}
            </Text>{' '}
            is not supported.
          </Text>
        </View>
      )
    }

    return (
      <View style={[spacings.pv, spacings.ph, flexbox.center, flexbox.flex1]}>
        <Text fontSize={24} style={spacings.mbMi} weight="semiBold">
          Error loading transaction
        </Text>
        <Text fontSize={16}>
          Invalid url params. Make sure{' '}
          <Text fontSize={16} weight="medium">
            chainId and txnId/userOpHash
          </Text>{' '}
          are provided.
        </Text>
      </View>
    )
  }

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

  return (
    <View style={flexbox.flex1}>
      <Image
        style={styles.backgroundImage}
        source={maxWidthSize('xl') ? (meshGradientLarge as any) : (meshGradient as any)}
        resizeMode="cover"
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Header activeStep={activeStep} network={network} />
          <Steps
            activeStep={activeStep}
            txnId={txnId}
            userOpHash={userOpHash}
            stepsState={stepsState}
            summary={summary}
            delegation={state?.stepsState?.delegation}
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
    </View>
  )
}

export default memo(Benzin)

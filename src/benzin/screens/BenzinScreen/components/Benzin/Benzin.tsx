import { randomBytes } from 'ethers'
import React, { memo, ReactNode, useMemo } from 'react'
import { Image, ScrollView, StyleSheet, View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import gradient1560 from '@benzin/assets/images/gradient-1560.png'
import gradient1920 from '@benzin/assets/images/gradient-1920.png'
import gradient2560 from '@benzin/assets/images/gradient-2560.png'
import gradient780 from '@benzin/assets/images/gradient-780.png'
import Buttons from '@benzin/screens/BenzinScreen/components/Buttons'
import Header from '@benzin/screens/BenzinScreen/components/Header'
import Steps from '@benzin/screens/BenzinScreen/components/Steps'
import useBenzin from '@benzin/screens/BenzinScreen/hooks/useBenzin'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useControllerStore from '@common/hooks/useControllerStore'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import TransactionSummary from '@common/modules/sign-account-op/components/TransactionSummary'
import spacings, { DEVICE_HEIGHT, DEVICE_WIDTH, SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { MobileLayoutContainer } from '@mobile/components/MobileLayoutWrapper'
import { isExtension } from '@web/constants/browserapi'

import { IS_MOBILE_UP_BENZIN_BREAKPOINT } from '../../styles'
import getStyles from './styles'

const Benzin = ({
  state,
  children
}: {
  state: ReturnType<typeof useBenzin>
  children?: React.ReactNode
}) => {
  const { styles } = useTheme(getStyles)
  const { maxWidthSize } = useWindowSize()
  const { isStoreReady } = useControllerStore()
  const insets = useSafeAreaInsets()

  const summary = useMemo(() => {
    const calls = state?.stepsState?.calls
    if (!calls || !state.network?.chainId) return []

    return calls.map((call, i) => (
      <TransactionSummary
        key={call.data + randomBytes(6)}
        style={i !== calls.length! - 1 ? (spacings.mbSm as ViewStyle) : {}}
        call={call}
        chainId={state.network!.chainId}
        rightIcon={
          <OpenIcon
            width={IS_MOBILE_UP_BENZIN_BREAKPOINT || isMobile ? 20 : 14}
            height={IS_MOBILE_UP_BENZIN_BREAKPOINT || isMobile ? 20 : 14}
          />
        }
        onRightIconPress={state?.handleOpenExplorer}
        size={IS_MOBILE_UP_BENZIN_BREAKPOINT || isMobile ? 'lg' : 'sm'}
        type="benzin"
        hasCallFailed={call.status === AccountOpStatus.Rejected}
      />
    ))
    // Prevents unnecessary re-renders of the humanizer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.handleOpenExplorer, state?.network?.chainId, state?.stepsState?.calls?.length])

  const backgroundSource = useMemo(() => {
    if (maxWidthSize(1920)) return gradient2560
    if (maxWidthSize(1560)) return gradient1920
    if (maxWidthSize(780) || isExtension) return gradient1560

    return gradient780
  }, [maxWidthSize])

  if ((state && !state?.isInitialized) || !isStoreReady)
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
    handleCopyText,
    handleOpenExplorer,
    showCopyBtn,
    showOpenExplorerBtn
  } = state

  const Container = ({ children }: { children: React.ReactNode }) => {
    if (isMobile) {
      return <MobileLayoutContainer withBottomInset={false}>{children}</MobileLayoutContainer>
    }
    return <View style={flexbox.flex1}>{children}</View>
  }

  return (
    <Container>
      <View
        pointerEvents="none"
        style={
          isWeb
            ? { ...StyleSheet.absoluteFillObject, zIndex: -1 }
            : {
                position: 'absolute',
                top: -insets.top - SPACING_SM,
                left: 0,
                height: DEVICE_HEIGHT,
                width: DEVICE_WIDTH
              }
        }
      >
        <Image
          style={isWeb ? styles.backgroundImage : { flex: 1, objectFit: 'fill' }}
          source={
            typeof backgroundSource === 'number' ? backgroundSource : { uri: backgroundSource }
          }
          resizeMode="cover"
        />
      </View>
      <ScrollView style={flexbox.flex1} contentContainerStyle={styles.container}>
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
          {!children ? (
            <Buttons
              handleCopyText={handleCopyText}
              handleOpenExplorer={handleOpenExplorer}
              showCopyBtn={showCopyBtn}
              showOpenExplorerBtn={showOpenExplorerBtn}
            />
          ) : (
            // Leave enough space for the absolutely positioned buttons
            <View style={{ marginBottom: isMobile ? 0 : 80 }} />
          )}
        </View>
      </ScrollView>
      {children}
    </Container>
  )
}

export default memo(Benzin)

import networks, { NetworkType } from 'ambire-common/src/constants/networks'
import React, { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native'
// Using the ScrollView from 'react-native' was working just fine on all iOS
// devices, but not for all Android devices. So using this ScrollView instance
// was the only way to achieve normal scrolling (dragging) behavior for
// Samsung Galaxy S20 for example.
// {@link https://stackoverflow.com/a/66166811/1333836}
import { ScrollView } from 'react-native-gesture-handler'

import Title from '@common/components/Title'
import { isAndroid, isRelayerless } from '@common/config/env'
import useNetwork from '@common/hooks/useNetwork'
import textStyles from '@common/styles/utils/text'

import NetworkChangerItem from './NetworkChangerItem'
import styles, { SINGLE_ITEM_HEIGHT } from './styles'

interface Props {
  closeBottomSheet?: () => void
}

const NetworkChanger: React.FC<Props> = () => {
  const { t } = useTranslation()
  const { network, setNetwork } = useNetwork()
  const scrollRef: any = useRef(null)

  const allVisibleNetworks = useMemo(
    () => networks.filter((n) => !n.hide).filter((n) => isRelayerless || !n.relayerlessOnly),
    []
  )

  const currentNetworkIndex = useMemo(
    () => allVisibleNetworks.map((n) => n.chainId).indexOf(network?.chainId || 0),
    [network?.chainId, allVisibleNetworks]
  )

  const handleChangeNetwork = useCallback(
    (_network: NetworkType) => {
      if (!_network) return
      if (_network.chainId === network?.chainId) return

      setNetwork(_network.chainId)
    },
    [network?.chainId, setNetwork]
  )

  const handleChangeNetworkByScrolling = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Get the currently selected network index, based on the idea from this
      // thread, but implemented vertically and based on our fixed item height.
      // {@link https://stackoverflow.com/a/56736109/1333836}
      // PS: Rounding it, because sometimes the calculation returns funky
      // numbers due to the JS engine glitch (like 3.0001).
      const index = Math.round(event.nativeEvent.contentOffset.y / SINGLE_ITEM_HEIGHT)
      const selectedNetwork = allVisibleNetworks[index]

      return handleChangeNetwork(selectedNetwork)
    },
    [handleChangeNetwork, allVisibleNetworks]
  )

  const renderNetwork = (_network: NetworkType, idx: number) => {
    const isActive = _network.chainId === network?.chainId

    const handleChangeNetworkByPressing = useCallback(
      (itemIndex: number) => {
        scrollRef?.current?.scrollTo({ x: 0, y: itemIndex * SINGLE_ITEM_HEIGHT, animated: true })

        /**
         * Calling `.scrollTo` on Android doesn't trigger the `onMomentumScrollEnd`
         * event. So this additional handler is needed, only for Android,
         * {@link https://stackoverflow.com/a/46788635/1333836}
         */
        if (isAndroid) {
          handleChangeNetwork(allVisibleNetworks[itemIndex])
        }
      },
      // The react-hooks/exhaustive-deps plugin wrongly assumes that
      // the `handleChangeNetwork` is unnecessary dependency. It is!
      [handleChangeNetwork] // eslint-disable-line react-hooks/exhaustive-deps
    )

    return (
      <NetworkChangerItem
        key={_network.chainId}
        idx={idx}
        name={_network.name}
        iconName={_network.id}
        isActive={isActive}
        onPress={handleChangeNetworkByPressing}
      />
    )
  }

  return (
    <>
      <Title style={textStyles.center} type="small">
        {t('Change Network')}
      </Title>
      <View style={styles.networksContainer}>
        <View style={styles.networkBtnContainerActive} />
        <ScrollView
          ref={scrollRef}
          pagingEnabled
          snapToInterval={SINGLE_ITEM_HEIGHT}
          contentOffset={{
            y: SINGLE_ITEM_HEIGHT * currentNetworkIndex,
            x: 0
          }}
          contentContainerStyle={{
            paddingTop: SINGLE_ITEM_HEIGHT * 2,
            paddingBottom: SINGLE_ITEM_HEIGHT * 2
          }}
          showsVerticalScrollIndicator={false}
          // Note: when the scroll happens programmatically (via .scrollTo),
          // this event gets fired for iOS only.
          onMomentumScrollEnd={handleChangeNetworkByScrolling}
          scrollEventThrottle={16}
        >
          {allVisibleNetworks.map(renderNetwork)}
        </ScrollView>
      </View>
    </>
  )
}

export default React.memo(NetworkChanger)

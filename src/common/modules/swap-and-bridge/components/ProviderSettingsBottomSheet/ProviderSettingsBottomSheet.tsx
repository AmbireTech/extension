import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { SwapProviderInfo } from '@ambire-common/interfaces/swapAndBridge'
import BungeeIcon from '@common/assets/svg/BungeeIcon/BungeeIcon'
import LiFiIcon from '@common/assets/svg/LiFiIcon/LiFiIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import UniswapIcon from '@common/assets/svg/UniswapIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Checkbox from '@common/components/Checkbox'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const PROVIDER_ICON_WIDTH = 72
const PROVIDER_ICON_STYLE = { width: PROVIDER_ICON_WIDTH }
const SETTINGS_BUTTON_STYLE = { width: 40, height: 40 }
const COMPACT_SETTINGS_BUTTON_STYLE = { width: 28, height: 28 }
const SHEET_STYLE = isWeb ? { width: '100%' as const, maxWidth: 480 } : undefined

const selectSwapProviders = (state: AllControllersMappingType['SwapAndBridgeController']) =>
  state.swapProviders
const selectDisabledSwapProviderIds = (
  state: AllControllersMappingType['SwapAndBridgeController']
) => state.disabledSwapProviderIds

const ProviderIconComponent = ({ providerId }: { providerId: SwapProviderInfo['id'] }) => {
  if (providerId === 'socket' || providerId === 'socketv3') {
    return <BungeeIcon width={56.7} height={11.2} />
  }
  if (providerId === 'uniswap') return <UniswapIcon width={24} height={24} />
  if (providerId === 'lifi') return <LiFiIcon width={45} height={16} />

  return null
}

const ProviderIcon = React.memo(ProviderIconComponent)

const ProviderRowComponent = ({
  provider,
  isEnabled,
  setProviderEnabled
}: {
  provider: SwapProviderInfo
  isEnabled: boolean
  setProviderEnabled: (providerId: SwapProviderInfo['id'], isEnabled: boolean) => void
}) => {
  const onValueChange = useCallback(
    (nextIsEnabled: boolean) => setProviderEnabled(provider.id, nextIsEnabled),
    [provider.id, setProviderEnabled]
  )

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.pvSm]}>
      <View style={[PROVIDER_ICON_STYLE, flexbox.alignCenter]}>
        <ProviderIcon providerId={provider.id} />
      </View>
      <Text fontSize={16} weight="medium" style={flexbox.flex1}>
        {provider.name}
      </Text>
      <Checkbox
        testID={`swap-provider-${provider.id}-checkbox`}
        value={isEnabled}
        onValueChange={onValueChange}
      />
    </View>
  )
}

const ProviderRow = React.memo(ProviderRowComponent)

const ProviderSettingsButtonComponent = ({
  onPress,
  compact = false
}: {
  onPress: () => void
  compact?: boolean
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <HoverablePressable
      accessibilityLabel={t('Swap provider settings')}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      testID="swap-provider-settings-button"
    >
      <View
        style={[compact ? COMPACT_SETTINGS_BUTTON_STYLE : SETTINGS_BUTTON_STYLE, flexbox.center]}
      >
        <SettingsIcon width={24} height={24} color={theme.iconPrimary} />
      </View>
    </HoverablePressable>
  )
}

export const ProviderSettingsButton = React.memo(ProviderSettingsButtonComponent)

const ProviderSettingsBottomSheet = ({
  sheetRef,
  closeBottomSheet
}: {
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
}) => {
  const { t } = useTranslation()
  const { state: swapProviders, dispatch: swapAndBridgeDispatch } = useController(
    'SwapAndBridgeController',
    selectSwapProviders
  )
  const { state: disabledSwapProviderIds } = useController(
    'SwapAndBridgeController',
    selectDisabledSwapProviderIds
  )

  const setProviderEnabled = useCallback(
    (providerId: SwapProviderInfo['id'], isEnabled: boolean) => {
      swapAndBridgeDispatch({
        type: 'method',
        params: { method: 'setSwapProviderEnabled', args: [providerId, isEnabled] }
      })
    },
    [swapAndBridgeDispatch]
  )

  const headerComponent = useMemo(
    () => (
      <ModalHeader
        title={t('Swap providers')}
        handleClose={closeBottomSheet}
        titlePosition={isMobile ? 'left' : 'center'}
      />
    ),
    [closeBottomSheet, t]
  )

  return (
    <BottomSheet
      id="swap-provider-settings"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      adjustToContentHeight
      type="bottom-sheet"
      HeaderComponent={headerComponent}
      style={SHEET_STYLE}
    >
      <Text fontSize={14} appearance="secondaryText" style={spacings.mb}>
        {t('Choose which providers can be used to find swap and bridge routes.')}
      </Text>
      {swapProviders.map((provider: SwapProviderInfo) => (
        <ProviderRow
          key={provider.id}
          provider={provider}
          isEnabled={!disabledSwapProviderIds.includes(provider.id)}
          setProviderEnabled={setProviderEnabled}
        />
      ))}
    </BottomSheet>
  )
}

export default React.memo(ProviderSettingsBottomSheet)

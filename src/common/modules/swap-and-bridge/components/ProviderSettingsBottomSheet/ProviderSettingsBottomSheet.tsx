import { memo, RefObject, useCallback, useMemo } from 'react'
import { View } from 'react-native'

import BungeeIcon from '@common/assets/svg/BungeeIcon/BungeeIcon'
import CowSwapIcon from '@common/assets/svg/CowSwapIcon'
import LiFiIcon from '@common/assets/svg/LiFiIcon/LiFiIcon'
import SecurityIcon from '@common/assets/svg/SecurityIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import UniswapIcon from '@common/assets/svg/UniswapIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import FatToggle from '@common/components/FatToggle'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import type { SwapProviderInfo } from '@ambire-common/interfaces/swapAndBridge'
import type { Modalize } from 'react-native-modalize'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const PROVIDER_ICON_WIDTH = 72
const PROVIDER_ICON_STYLE = { width: PROVIDER_ICON_WIDTH }
const SETTINGS_BUTTON_STYLE = { width: 40, height: 40 }
const COMPACT_SETTINGS_BUTTON_STYLE = { width: 28, height: 28 }
const SHEET_STYLE = isWeb ? { width: '100%' as const, maxWidth: 480 } : undefined
const COW_SWAP_PROVIDER_ID = 'cowswap'

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
  if (providerId === 'cowswap') return <CowSwapIcon width={24} height={24} />

  return null
}

const ProviderIcon = memo(ProviderIconComponent)

const ProviderRowComponent = ({
  provider,
  isEnabled,
  setProviderEnabled
}: {
  provider: SwapProviderInfo
  isEnabled: boolean
  setProviderEnabled: (providerId: SwapProviderInfo['id'], isEnabled: boolean) => void
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const onValueChange = useCallback(
    (nextIsEnabled: boolean) => setProviderEnabled(provider.id, nextIsEnabled),
    [provider.id, setProviderEnabled]
  )

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.pvSm]}>
      <View style={[PROVIDER_ICON_STYLE]}>
        <ProviderIcon providerId={provider.id} />
      </View>
      <View style={flexbox.flex1}>
        <Text fontSize={16} weight="medium">
          {provider.name}
        </Text>
        {provider.id !== COW_SWAP_PROVIDER_ID && (
          <Text fontSize={12} appearance="tertiaryText" style={spacings.mtMi}>
            {t('No MEV protection')}
          </Text>
        )}
        {provider.id === COW_SWAP_PROVIDER_ID && (
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.alignSelfStart,
              spacings.mtMi,
              spacings.phTy,
              spacings.pvMi,
              common.borderRadiusSecondary,
              {
                backgroundColor: theme.primaryAccent100,
                borderColor: theme.primaryAccent200,
                borderWidth: 1
              }
            ]}
          >
            <SecurityIcon width={10} height={12} color={theme.primaryAccent} />
            <Text fontSize={12} weight="medium" color={theme.primaryAccent} style={spacings.mlMi}>
              {t('MEV protected')}
            </Text>
          </View>
        )}
      </View>
      <FatToggle
        testID={`swap-provider-${provider.id}-toggle`}
        isOn={isEnabled}
        onToggle={onValueChange}
        trackStyle={spacings.mr0}
      />
    </View>
  )
}

const ProviderRow = memo(ProviderRowComponent)

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

export const ProviderSettingsButton = memo(ProviderSettingsButtonComponent)

const SwapProviderSettingsComponent = () => {
  const { t } = useTranslation()
  const { state: swapProviders, dispatch: swapAndBridgeDispatch } = useController(
    'SwapAndBridgeController',
    selectSwapProviders
  )
  const { state: disabledSwapProviderIds } = useController(
    'SwapAndBridgeController',
    selectDisabledSwapProviderIds
  )
  const { theme } = useTheme()

  const hasCowSwapProvider = useMemo(
    () => swapProviders.some(({ id }) => id === COW_SWAP_PROVIDER_ID),
    [swapProviders]
  )
  const isMevProtectionEnabled = useMemo(
    () =>
      hasCowSwapProvider &&
      swapProviders.every(({ id }) =>
        id === COW_SWAP_PROVIDER_ID
          ? !disabledSwapProviderIds.includes(id)
          : disabledSwapProviderIds.includes(id)
      ),
    [disabledSwapProviderIds, hasCowSwapProvider, swapProviders]
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

  const setMevProtectionEnabled = useCallback(
    (isEnabled: boolean) => {
      swapAndBridgeDispatch({
        type: 'method',
        params: { method: 'setMevProtectionEnabled', args: [isEnabled] }
      })
    },
    [swapAndBridgeDispatch]
  )

  return (
    <>
      <Text fontSize={14} appearance="secondaryText" style={spacings.mbTy}>
        {t('Choose your providers for suggesting swap and bridge routes.')}
      </Text>
      {hasCowSwapProvider && (
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            spacings.pvSm,
            spacings.mbTy,
            { borderBottomColor: theme.primaryBorder, borderBottomWidth: 1 }
          ]}
        >
          <View style={PROVIDER_ICON_STYLE}>
            <SecurityIcon
              width={24}
              height={28}
              color={isMevProtectionEnabled ? theme.success400 : theme.iconPrimary}
            />
          </View>
          <View style={flexbox.flex1}>
            <Text fontSize={16} weight="medium">
              {t('Require MEV protection')}
            </Text>
            <Text fontSize={12} appearance="secondaryText" style={spacings.mtMi}>
              {t('Only CoW Swap supports this setting')}
            </Text>
          </View>
          <FatToggle
            testID="mev-protection-toggle"
            isOn={isMevProtectionEnabled}
            onToggle={setMevProtectionEnabled}
            trackStyle={spacings.mr0}
          />
        </View>
      )}
      {swapProviders.map((provider: SwapProviderInfo) => (
        <ProviderRow
          key={provider.id}
          provider={provider}
          isEnabled={!disabledSwapProviderIds.includes(provider.id)}
          setProviderEnabled={setProviderEnabled}
        />
      ))}
    </>
  )
}

export const SwapProviderSettings = memo(SwapProviderSettingsComponent)

const ProviderSettingsBottomSheet = ({
  sheetRef,
  closeBottomSheet
}: {
  sheetRef: RefObject<Modalize>
  closeBottomSheet: () => void
}) => {
  const { t } = useTranslation()

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
      <SwapProviderSettings />
    </BottomSheet>
  )
}

export default memo(ProviderSettingsBottomSheet)

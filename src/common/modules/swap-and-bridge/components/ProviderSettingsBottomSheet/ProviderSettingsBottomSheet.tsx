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
import type { SheetRef } from '@common/components/BottomSheet/useSheetRef'
import FatToggle from '@common/components/FatToggle'
import HeaderButton from '@common/components/HeaderButton'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import common, { BORDER_RADIUS_SECONDARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import type { SwapProviderInfo } from '@ambire-common/interfaces/swapAndBridge'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const PROVIDER_ICON_WIDTH = 72
const PROVIDER_ICON_STYLE = { width: PROVIDER_ICON_WIDTH }
const SHEET_STYLE = isWeb ? { width: '100%' as const, maxWidth: 480 } : undefined
const COW_SWAP_PROVIDER_ID = 'cowswap'
// The grouped list of the design: one card, each logo on a tile, rows split by a line
const GROUPED_CARD_RADIUS = 24
const GROUPED_ICON_TILE_STYLE = {
  width: 64,
  height: 40,
  borderRadius: BORDER_RADIUS_SECONDARY,
  ...flexbox.center
}
const GROUPED_ROW_STYLE = { columnGap: SPACING_SM }
const SEPARATOR_STYLE = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1 }

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
  setProviderEnabled,
  isGrouped,
  isFirst
}: {
  provider: SwapProviderInfo
  isEnabled: boolean
  setProviderEnabled: (providerId: SwapProviderInfo['id'], isEnabled: boolean) => void
  isGrouped: boolean
  isFirst: boolean
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const onValueChange = useCallback(
    (nextIsEnabled: boolean) => setProviderEnabled(provider.id, nextIsEnabled),
    [provider.id, setProviderEnabled]
  )
  const toggle = (
    <FatToggle
      testID={`swap-provider-${provider.id}-toggle`}
      isOn={isEnabled}
      onToggle={onValueChange}
      trackStyle={spacings.mr0}
    />
  )

  if (isGrouped) {
    const isCowSwap = provider.id === COW_SWAP_PROVIDER_ID

    return (
      <View style={[flexbox.directionRow, flexbox.alignCenter, GROUPED_ROW_STYLE]}>
        <View style={[GROUPED_ICON_TILE_STYLE, { backgroundColor: theme.primaryBackground }]}>
          <ProviderIcon providerId={provider.id} />
        </View>
        {/* The line starts after the logo, like an inset list separator */}
        <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter, spacings.pvSm]}>
          {!isFirst && (
            <View style={[SEPARATOR_STYLE, { backgroundColor: theme.hoverBackground }]} />
          )}
          <View style={[flexbox.flex1, spacings.mrSm]}>
            <Text fontSize={15} weight="medium">
              {provider.name}
            </Text>
            {!isCowSwap && (
              <Text fontSize={13} appearance="secondaryText" style={spacings.mtMi}>
                {t('No MEV protection')}
              </Text>
            )}
            {isCowSwap && (
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.alignSelfStart,
                  spacings.mtMi,
                  spacings.phTy,
                  common.borderRadiusSecondary,
                  { backgroundColor: theme.successBackground, paddingVertical: 2 }
                ]}
              >
                <SecurityIcon width={10} height={12} color={theme.successText} />
                <Text fontSize={12} weight="medium" color={theme.successText} style={spacings.mlMi}>
                  {t('MEV protected')}
                </Text>
              </View>
            )}
          </View>
          {toggle}
        </View>
      </View>
    )
  }

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
      {toggle}
    </View>
  )
}

const ProviderRow = memo(ProviderRowComponent)

const ProviderSettingsButtonComponent = ({ onPress }: { onPress: () => void }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <HeaderButton
      icon={<SettingsIcon width={20} height={20} color={theme.iconPrimary} />}
      accessibilityLabel={t('Swap provider settings')}
      onPress={onPress}
      testID="swap-provider-settings-button"
    />
  )
}

export const ProviderSettingsButton = memo(ProviderSettingsButtonComponent)

const SwapProviderSettingsComponent = ({
  isGrouped = false
}: {
  /** All providers in one card, each logo on a tile and the rows split by a line. */
  isGrouped?: boolean
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
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

  return (
    <>
      <Text fontSize={isGrouped ? 13 : 14} appearance="secondaryText" style={spacings.mbTy}>
        {isGrouped
          ? t('Choose who can suggest routes for your swaps and bridges.')
          : t('Choose your providers for suggesting swap and bridge routes.')}
      </Text>
      <View
        style={
          isGrouped && [
            spacings.plSm,
            spacings.pr,
            {
              borderRadius: GROUPED_CARD_RADIUS,
              // Filled like the account rows, so the card's edges show in the sheet
              backgroundColor: theme.secondaryBackground
            }
          ]
        }
      >
        {swapProviders.map((provider: SwapProviderInfo, index: number) => (
          <ProviderRow
            key={provider.id}
            provider={provider}
            isEnabled={!disabledSwapProviderIds.includes(provider.id)}
            setProviderEnabled={setProviderEnabled}
            isGrouped={isGrouped}
            isFirst={index === 0}
          />
        ))}
      </View>
    </>
  )
}

export const SwapProviderSettings = memo(SwapProviderSettingsComponent)

const ProviderSettingsBottomSheet = ({
  sheetRef,
  closeBottomSheet
}: {
  sheetRef: RefObject<SheetRef | null>
  closeBottomSheet: () => void
}) => {
  const { t } = useTranslation()

  const headerComponent = useMemo(
    () => <ModalHeader title={t('Swap providers')} handleClose={closeBottomSheet} />,
    [closeBottomSheet, t]
  )

  return (
    <BottomSheet
      id="swap-provider-settings"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      adjustToContentHeight
      HeaderComponent={headerComponent}
      style={SHEET_STYLE}
    >
      <SwapProviderSettings isGrouped />
    </BottomSheet>
  )
}

export default memo(ProviderSettingsBottomSheet)

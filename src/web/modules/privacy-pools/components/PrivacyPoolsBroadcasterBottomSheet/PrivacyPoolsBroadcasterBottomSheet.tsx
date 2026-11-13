import React, { FC, memo, RefObject, useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import { PrivacyPoolsBroadcaster } from '@ambire-common/interfaces/privacyPools'
import KohakuIcon from '@common/assets/svg/KohakuIcon'
import OxBowIcon from '@common/assets/svg/OxBowIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import getAccountStyles from '@common/modules/account-select/components/Account/styles'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import type { Modalize } from 'react-native-modalize'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const LOGO_SIZE = 32
const SETTINGS_BUTTON_SIZE = 40
const SETTINGS_BUTTON_STYLE = { width: SETTINGS_BUTTON_SIZE, height: SETTINGS_BUTTON_SIZE }
const SHEET_STYLE = isWeb ? { width: '100%' as const, maxWidth: 480 } : undefined
const RADIO_SIZE = 20
const RADIO_DOT_SIZE = 10
const DISABLED_STYLE = { opacity: 0.5 }

const selectBroadcaster = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.broadcaster
const selectIsErc4337Enabled = (state: AllControllersMappingType['FeatureFlagsController']) =>
  state.flags.erc4337

/** What sets the broadcasters apart for the user. Translated where shown. */
type BroadcasterOption = {
  id: PrivacyPoolsBroadcaster
  name: string
  Icon: FC<SvgProps>
  /** Colored by how well a transfer blends in, the main thing the choice trades off. */
  anonymity: { text: string; appearance: 'successText' | 'warningText' }
  fee: string
}

const BROADCASTER_OPTIONS: BroadcasterOption[] = [
  {
    id: '0xbow',
    name: '0xBow',
    Icon: OxBowIcon,
    anonymity: { text: 'Mature anonymity', appearance: 'successText' },
    fee: '0.1% + network fee'
  },
  {
    id: 'kohaku',
    name: 'Kohaku',
    Icon: KohakuIcon,
    anonymity: { text: 'Growing anonymity', appearance: 'warningText' },
    fee: 'Network fee only'
  }
]

/** A card per option, like the account rows: it highlights on hover and the selected one stands out. */
const BroadcasterRowComponent = ({
  option,
  isSelected,
  disabledReason,
  onSelect
}: {
  option: BroadcasterOption
  isSelected: boolean
  /** Shown under the option when it cannot be chosen. */
  disabledReason: string | null
  onSelect: (broadcaster: PrivacyPoolsBroadcaster) => void
}) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getAccountStyles)
  const { id, name, Icon, anonymity, fee } = option
  const handlePress = useCallback(() => onSelect(id), [id, onSelect])
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    // The same card as the account rows
    values: { from: theme.secondaryBackground, to: theme.tertiaryBackground }
  })

  // The same as the selected account
  const selectedStyle = useMemo(
    () => ({ backgroundColor: theme.primaryAccent100, borderColor: theme.primaryAccent }),
    [theme.primaryAccent, theme.primaryAccent100]
  )

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={!!disabledReason}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected, disabled: !!disabledReason }}
      testID={`privacy-pools-broadcaster-${id}`}
      {...bindAnim}
      style={[styles.accountContainer, spacings.pvSm, animStyle, isSelected && selectedStyle]}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter, !!disabledReason && DISABLED_STYLE]}>
        <View style={spacings.mrSm}>
          <Icon width={LOGO_SIZE} height={LOGO_SIZE} />
        </View>
        <View style={flexbox.flex1}>
          <Text fontSize={16} weight="medium">
            {name}
          </Text>
          <Text fontSize={12} weight="medium" style={spacings.mtMi}>
            <Text fontSize={12} weight="medium" appearance={anonymity.appearance}>
              {t(anonymity.text)}
            </Text>
            <Text fontSize={12} weight="medium" appearance="secondaryText">
              {` · ${t(fee)}`}
            </Text>
          </Text>
          {!!disabledReason && (
            <Text fontSize={12} appearance="tertiaryText" style={spacings.mtMi}>
              {disabledReason}
            </Text>
          )}
        </View>
        <View
          style={[
            flexbox.center,
            spacings.mlSm,
            {
              width: RADIO_SIZE,
              height: RADIO_SIZE,
              borderRadius: RADIO_SIZE / 2,
              borderWidth: 2,
              borderColor: isSelected ? theme.primary : theme.secondaryBorder
            }
          ]}
        >
          {isSelected && (
            <View
              style={{
                width: RADIO_DOT_SIZE,
                height: RADIO_DOT_SIZE,
                borderRadius: RADIO_DOT_SIZE / 2,
                backgroundColor: theme.primary
              }}
            />
          )}
        </View>
      </View>
    </AnimatedPressable>
  )
}

const BroadcasterRow = memo(BroadcasterRowComponent)

const PrivacyPoolsBroadcasterButtonComponent = ({ onPress }: { onPress: () => void }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <HoverablePressable
      accessibilityLabel={t('Send settings')}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      testID="privacy-pools-broadcaster-settings-button"
    >
      <View style={[SETTINGS_BUTTON_STYLE, flexbox.center]}>
        <SettingsIcon width={24} height={24} color={theme.iconPrimary} />
      </View>
    </HoverablePressable>
  )
}

/** Opens `PrivacyPoolsBroadcasterBottomSheet`, from the Send screen's header. */
export const PrivacyPoolsBroadcasterButton = memo(PrivacyPoolsBroadcasterButtonComponent)

/**
 * Lets the user choose who sends transfers out of a Privacy Pools account and pays their gas, like
 * Swap & Bridge's provider settings. The choice is kept for all of the user's Privacy Pools accounts.
 */
const PrivacyPoolsBroadcasterBottomSheet = ({
  sheetRef,
  closeBottomSheet
}: {
  sheetRef: RefObject<Modalize>
  closeBottomSheet: () => void
}) => {
  const { t } = useTranslation()
  const { state: broadcaster, dispatch } = useController(
    'PrivacyPoolsController',
    selectBroadcaster
  )
  const { state: isErc4337Enabled } = useController(
    'FeatureFlagsController',
    selectIsErc4337Enabled
  )

  const selectBroadcasterOption = useCallback(
    (nextBroadcaster: PrivacyPoolsBroadcaster) => {
      dispatch({ type: 'method', params: { method: 'setBroadcaster', args: [nextBroadcaster] } })
    },
    [dispatch]
  )

  // Kohaku sends through an ERC-4337 bundler, which the user can opt out of
  const getDisabledReason = useCallback(
    (id: PrivacyPoolsBroadcaster) => {
      if (id !== 'kohaku' || isErc4337Enabled) return null

      return t(
        'Needs "ERC-4337 smart account features", which you turned off. Turn it on in Settings > Privacy opt-outs to choose it.'
      )
    },
    [isErc4337Enabled, t]
  )

  const headerComponent = useMemo(
    () => (
      <ModalHeader
        title={t('Send through')}
        handleClose={closeBottomSheet}
        titlePosition={isMobile ? 'left' : 'center'}
      />
    ),
    [closeBottomSheet, t]
  )

  return (
    <BottomSheet
      id="privacy-pools-broadcaster-settings"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      adjustToContentHeight
      HeaderComponent={headerComponent}
      style={SHEET_STYLE}
    >
      <Text fontSize={14} appearance="secondaryText" style={spacings.mbTy}>
        {t('Choose who sends your private transfer.')}
      </Text>
      {BROADCASTER_OPTIONS.map((option) => (
        <BroadcasterRow
          key={option.id}
          option={option}
          isSelected={broadcaster === option.id}
          disabledReason={getDisabledReason(option.id)}
          onSelect={selectBroadcasterOption}
        />
      ))}
    </BottomSheet>
  )
}

export default memo(PrivacyPoolsBroadcasterBottomSheet)

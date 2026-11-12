import React, { FC, memo, RefObject, useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { PrivacyPoolsBroadcaster } from '@ambire-common/interfaces/privacyPools'
import KohakuIcon from '@common/assets/svg/KohakuIcon'
import OxBowIcon from '@common/assets/svg/OxBowIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import Badge from '@common/components/Badge'
import { BadgeType } from '@common/components/Badge/types'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import type { Modalize } from 'react-native-modalize'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const ICON_COLUMN_STYLE = { width: 72 }
const SETTINGS_BUTTON_SIZE = 40
const SETTINGS_BUTTON_STYLE = { width: SETTINGS_BUTTON_SIZE, height: SETTINGS_BUTTON_SIZE }
const SHEET_STYLE = isWeb ? { width: '100%' as const, maxWidth: 480 } : undefined
const RADIO_SIZE = 20
const RADIO_DOT_SIZE = 10

const selectBroadcaster = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.broadcaster
const selectIsErc4337Enabled = (state: AllControllersMappingType['FeatureFlagsController']) =>
  state.flags.erc4337

type BroadcasterBadge = { text: string; type: BadgeType }

/** What sets the broadcasters apart for the user. Translated where shown. */
type BroadcasterOption = {
  id: PrivacyPoolsBroadcaster
  name: string
  Icon: FC
  anonymity: BroadcasterBadge
  fee: BroadcasterBadge
  description: string
}

const BROADCASTER_OPTIONS: BroadcasterOption[] = [
  {
    id: '0xbow',
    name: '0xBow',
    Icon: OxBowIcon,
    anonymity: { text: 'Mature anonymity', type: 'success' },
    fee: { text: '0.1% + network fee', type: 'default' },
    description: 'Most private transfers are sent this way, so yours blends in with them.'
  },
  {
    id: 'kohaku',
    name: 'Kohaku',
    Icon: KohakuIcon,
    anonymity: { text: 'Growing anonymity', type: 'warning' },
    fee: { text: 'Network fee only', type: 'success' },
    description:
      'Few transfers are sent this way so far, so yours is easier to tell apart. Any part of the fee that is not used goes back to the recipient.'
  }
]

const BroadcasterRowComponent = ({
  option,
  isSelected,
  disabledReason,
  onSelect
}: {
  option: BroadcasterOption
  isSelected: boolean
  /** Shown in place of the description when the option cannot be chosen. */
  disabledReason: string | null
  onSelect: (broadcaster: PrivacyPoolsBroadcaster) => void
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { id, name, Icon, anonymity, fee, description } = option
  const handlePress = useCallback(() => onSelect(id), [id, onSelect])

  return (
    <HoverablePressable
      onPress={handlePress}
      disabled={!!disabledReason}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected, disabled: !!disabledReason }}
      testID={`privacy-pools-broadcaster-${id}`}
    >
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.pvSm,
          { opacity: disabledReason ? 0.5 : 1 }
        ]}
      >
        <View style={ICON_COLUMN_STYLE}>
          <Icon />
        </View>
        <View style={flexbox.flex1}>
          <Text fontSize={16} weight="medium">
            {name}
          </Text>
          <View style={[flexbox.directionRow, flexbox.wrap, spacings.mtMi]}>
            <Badge type={anonymity.type} text={t(anonymity.text)} withRightSpacing />
            <Badge type={fee.type} text={t(fee.text)} />
          </View>
          <Text fontSize={12} appearance="tertiaryText" style={spacings.mtTy}>
            {disabledReason || t(description)}
          </Text>
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
    </HoverablePressable>
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
        {t(
          'Choose who sends your private transfers and pays their network fee, taking a fee from what you send.'
        )}
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

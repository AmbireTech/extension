import React, { useCallback, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'

import BadgeWithPreset from '@common/components/BadgeWithPreset'
import Dropdown from '@common/components/Dropdown'
import PrivacyPoolsAccountAvatar from '@common/components/PrivacyPoolsAccountAvatar'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import { PrivateAccountDisplay } from '@common/hooks/usePrivateAccounts'
import { PRIVACY_PROVIDER_BADGE_PRESETS } from '@common/modules/privacy/providers'
import useTheme from '@common/hooks/useTheme'
import getAccountStyles from '@common/modules/account-select/components/Account/styles'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectMainStatuses = (state: AllControllersMappingType['MainController']) => state.statuses

type Props = {
  account: PrivateAccountDisplay
  isSelected?: boolean
  /** Selects the account on press. Without it the row is display-only. */
  onSelect?: (account: PrivateAccountDisplay) => void
  /** Adds a "Remove account" option to the row's menu. */
  onRemove?: (account: PrivateAccountDisplay) => void
  containerStyle?: ViewStyle
}

const REMOVE_OPTION_VALUE = 'remove'

/**
 * `Account` for a private account (Privacy Pools, Tornado Cash), with the same height so both fit
 * one list. It shows no balance: that is known only once the account is opened and synced.
 */
const PrivacyPoolsAccountRow = ({
  account,
  isSelected = false,
  onSelect,
  onRemove,
  containerStyle
}: Props) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getAccountStyles)
  const { state: mainStatuses, dispatch: mainDispatch } = useController(
    'MainController',
    selectMainStatuses
  )
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: { from: theme.primaryBackground, to: theme.secondaryBackground }
  })

  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 })

  const handlePress = useCallback(() => {
    if (!onSelect) return

    if (!isSelected) {
      mainDispatch({
        type: 'method',
        params: {
          method: 'selectPrivateAccount',
          args: [{ providerId: account.providerId, seedId: account.seedId }]
        }
      })
    }

    onSelect(account)
  }, [account, isSelected, mainDispatch, onSelect])

  const menuOptions = useMemo(
    () => [
      {
        label: t('Remove account'),
        value: REMOVE_OPTION_VALUE,
        style: { color: theme.errorDecorative }
      }
    ],
    [t, theme.errorDecorative]
  )

  const handleMenuSelect = useCallback(
    (item: { value: string }) => {
      if (item.value === REMOVE_OPTION_VALUE) onRemove?.(account)
    },
    [account, onRemove]
  )

  return (
    <AnimatedPressable
      disabled={!onSelect || mainStatuses.selectAccount !== 'INITIAL'}
      onPress={handlePress}
      {...(onSelect ? bindAnim : {})}
      testID="privacy-pools-account"
      style={[
        styles.accountContainer,
        // @ts-expect-error: Web style
        onSelect ? animStyle : { cursor: 'default' },
        onSelect && isSelected && { backgroundColor: theme.secondaryBackground },
        containerStyle
      ]}
    >
      <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
        <PrivacyPoolsAccountAvatar style={spacings.mrTy} />
        <View style={[flexbox.flex1, flexbox.justifyCenter]}>
          <Text fontSize={14} weight="medium" numberOfLines={1} style={spacings.mrTy}>
            {t('Private account')}
          </Text>
          {/* The account has no name or address of its own, so its recovery phrase tells it apart */}
          <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
            {t('Added from {{seedLabel}}', { seedLabel: account.label })}
          </Text>
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtMi]}>
            <BadgeWithPreset
              preset={PRIVACY_PROVIDER_BADGE_PRESETS[account.providerId]}
              withRightSpacing={false}
            />
          </View>
        </View>
      </View>
      {!!onRemove && (
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mlTy]}>
          <Dropdown
            data={menuOptions}
            externalPosition={dropdownPosition}
            setExternalPosition={setDropdownPosition}
            onSelect={handleMenuSelect}
            kebabIconProps={{ width: 28, height: 28 }}
          />
        </View>
      )}
    </AnimatedPressable>
  )
}

export default React.memo(PrivacyPoolsAccountRow)

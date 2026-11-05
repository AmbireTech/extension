import React, { useCallback, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'

import BadgeWithPreset from '@common/components/BadgeWithPreset'
import Dropdown from '@common/components/Dropdown'
import EditableAccountName from '@common/components/EditableAccountName'
import PrivacyPoolsAccountAvatar from '@common/components/PrivacyPoolsAccountAvatar'
import PrivacyPoolsAccountIdentity from '@common/components/PrivacyPoolsAccountIdentity'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import { PrivacyPoolsAccountDisplay } from '@common/hooks/usePrivacyPoolsAccounts'
import useTheme from '@common/hooks/useTheme'
import getAccountStyles, {
  ACCOUNT_AVATAR_SIZE,
  ACCOUNT_SELECT_ACCOUNT_HEIGHT
} from '@common/modules/account-select/components/Account/styles'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectMainStatuses = (state: AllControllersMappingType['MainController']) => state.statuses
// The same as the name of a regular account row with settings
const NAME_TEXT_PROPS = { weight: 'medium' } as const

type Props = {
  account: PrivacyPoolsAccountDisplay
  isSelected?: boolean
  /** Selects the account on press. Without it the row is display-only. */
  onSelect?: (seedId: string) => void
  /** Adds a "Remove account" option to the row's menu. */
  onRemove?: (account: PrivacyPoolsAccountDisplay) => void
  /** Shows a pencil next to the name, which renames the account - like `withSettings` of `Account` */
  withRename?: boolean
  containerStyle?: ViewStyle
}

const REMOVE_OPTION_VALUE = 'remove'

/**
 * `Account` for a Privacy Pools account, with the same layout, height and selected state so both
 * fit one list. It shows no balance: that is known only once the account is opened and synced.
 */
const PrivacyPoolsAccountRow = ({
  account,
  isSelected = false,
  onSelect,
  onRemove,
  withRename = false,
  containerStyle
}: Props) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getAccountStyles)
  const { state: mainStatuses, dispatch: mainDispatch } = useController(
    'MainController',
    selectMainStatuses
  )
  const { dispatchAndWait: privacyPoolsDispatchAndWait } = useController('PrivacyPoolsController')
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: { from: theme.primaryBackground, to: theme.secondaryBackground }
  })

  // The same as the selected regular account
  const selectedStyle = useMemo(
    () => ({ backgroundColor: theme.primaryAccent100, borderColor: theme.primaryAccent }),
    [theme.primaryAccent, theme.primaryAccent100]
  )

  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 })

  // The account has no address of its own, so its recovery phrase tells it apart
  const sourceText = t('Added from {{seedLabel}}', { seedLabel: account.label })
  const identity = useMemo(
    () => <PrivacyPoolsAccountIdentity sourceText={sourceText} />,
    [sourceText]
  )

  const handleSaveName = useCallback(
    async (name: string) => {
      await privacyPoolsDispatchAndWait({
        type: 'method',
        params: { method: 'updateAccountLabel', args: [account.seedId, name] }
      })
    },
    [account.seedId, privacyPoolsDispatchAndWait]
  )

  const handlePress = useCallback(() => {
    if (!onSelect) return

    if (!isSelected) {
      mainDispatch({
        type: 'method',
        params: { method: 'selectPrivacyPoolsAccount', args: [account.seedId] }
      })
    }

    onSelect(account.seedId)
  }, [account.seedId, isSelected, mainDispatch, onSelect])

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
        containerStyle,
        { minHeight: ACCOUNT_SELECT_ACCOUNT_HEIGHT },
        // @ts-expect-error: Web style
        onSelect ? animStyle : { cursor: 'default' },
        onSelect && isSelected && selectedStyle
      ]}
    >
      <View style={flexbox.flex1}>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <PrivacyPoolsAccountAvatar size={ACCOUNT_AVATAR_SIZE} style={spacings.mrTy} />
          <View style={[flexbox.flex1, flexbox.justifyCenter]}>
            {withRename ? (
              <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mrTy]}>
                <EditableAccountName
                  identity={identity}
                  name={account.name}
                  onSave={handleSaveName}
                  textProps={NAME_TEXT_PROPS}
                  testID={`privacy-pools-account-name-${account.seedId}`}
                />
              </View>
            ) : (
              <Text fontSize={14} weight="medium" numberOfLines={1} style={styles.label}>
                {account.name}
              </Text>
            )}
            <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
              {sourceText}
            </Text>
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
        </View>
        <View style={styles.separator} />
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <BadgeWithPreset preset="privacy-pools" withRightSpacing={false} />
        </View>
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(PrivacyPoolsAccountRow)

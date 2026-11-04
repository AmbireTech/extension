import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { AMBIRE_V1_QUICK_ACC_MANAGER } from '@ambire-common/consts/addresses'
import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import CopyIcon from '@common/assets/svg/CopyIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import ImportIcon from '@common/assets/svg/ImportIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import AccountKeyIcon from '@common/components/AccountKeyIcon'
import AccountKeyDetails from '@common/components/AccountKeysBottomSheet/AccountKeyDetails'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Dropdown from '@common/components/Dropdown'
import ExportKey from '@common/components/ExportKey'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useHover, { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_MI } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import { getKeyDeviceName } from '@common/utils/keys'
import { getUiType } from '@common/utils/uiType'

export type AccountKeyType = {
  isImported: boolean
  addr: Key['addr']
  dedicatedToOneSA: Key['dedicatedToOneSA']
  type?: Key['type']
  meta?: Key['meta']
  label?: string
  onChains?: bigint[]
  /** False for an imported key of a type this device can't sign with (synced from another device) */
  isSupported?: boolean
}

/** The key a row's menu acts on */
export type AccountKeyMenuTarget = { addr: Key['addr']; type?: Key['type']; label?: string }

type Props = AccountKeyType & {
  isLast?: boolean
  style?: ViewStyle
  openAddAccountBottomSheet?: () => void
  showCopyAddr?: boolean
  account: Account
  keyIconColor?: string
  showExportImport?: boolean
  containerStyle?: ViewStyle
  tooltipContent?: string
  itemHeight?: number
  onExportKeyPress?: ({ addr, label }: { addr: string; label?: string }) => void
  /** Adds "Remove key" to the menu of imported keys */
  onRemoveKeyPress?: (key: AccountKeyMenuTarget) => void
  singleLineLabel?: boolean
}

const MENU_VALUES = { export: 'export', remove: 'remove' } as const

const { isPopup } = getUiType()

const AccountKey: React.FC<Props> = ({
  label,
  addr,
  showCopyAddr = true,
  dedicatedToOneSA,
  isLast = false,
  type,
  isImported,
  style,
  containerStyle,
  openAddAccountBottomSheet,
  account,
  meta,
  keyIconColor,
  showExportImport = false,
  onChains,
  tooltipContent,
  itemHeight = 48,
  onExportKeyPress,
  onRemoveKeyPress,
  singleLineLabel = false,
  isSupported = true
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()

  const [bindKeyDetailsAnim, keyDetailsAnimStyles] = useCustomHover({
    property: 'bottom',
    values: { from: 0, to: -2 }
  })
  const { ref: sheetRefExportKey, open: openExportKey, close: closeExportKey } = useModalize()
  const [bindCopyIconAnim, copyIconAnimStyle] = useHover({
    preset: 'opacityInverted'
  })
  const fontSize = isPopup ? 13 : 16
  const isKeyAmbireV1 = addr === AMBIRE_V1_QUICK_ACC_MANAGER
  const canExportOrImportKey = showExportImport && !isKeyAmbireV1
  const [isShowingDetails, setIsShowingDetails] = useState<boolean>(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  const handleCopy = useCallback(async () => {
    try {
      await setStringAsync(addr)
      addToast(t('Key address copied to clipboard'), { type: 'success' })
    } catch {
      addToast(t('Could not copy the key address to the clipboard'), { type: 'error' })
    }
  }, [addr, addToast, t])

  const shortAddr = shortenAddress(addr, 13)

  const isInternal = !type || type === 'internal'
  const canExportKey = isImported && isInternal

  const reimportAccount = useCallback(() => {
    if (openAddAccountBottomSheet) openAddAccountBottomSheet()
  }, [openAddAccountBottomSheet])

  const handleExportKeyPress = useCallback(() => {
    if (onExportKeyPress) {
      onExportKeyPress({ addr, label })
      return
    }

    openExportKey()
  }, [addr, label, onExportKeyPress, openExportKey])

  const handleToggleDetails = useCallback(() => {
    setIsShowingDetails((p) => !p)
  }, [])

  // Hardware wallet keys never leave the device, so only private keys can be exported.
  // A Safe's keys are its owners, so they are named so in its menu
  const menuItems = useMemo(() => {
    const isSafeOwner = !!account.safeCreation
    const items: { label: string; value: string; style?: { color: string } }[] = []
    if (canExportKey)
      items.push({
        label: isSafeOwner ? t('Export owner') : t('Export key'),
        value: MENU_VALUES.export
      })
    if (onRemoveKeyPress)
      items.push({
        label: isSafeOwner ? t('Remove owner') : t('Remove key'),
        value: MENU_VALUES.remove,
        style: { color: theme.errorDecorative as string }
      })
    return items
  }, [account.safeCreation, canExportKey, onRemoveKeyPress, t, theme.errorDecorative])

  const handleMenuSelect = useCallback(
    ({ value }: { value: string }) => {
      if (value === MENU_VALUES.export) handleExportKeyPress()
      if (value === MENU_VALUES.remove) onRemoveKeyPress?.({ addr, type, label })
    },
    [addr, handleExportKeyPress, label, onRemoveKeyPress, type]
  )

  return (
    <View
      style={[
        {
          backgroundColor: theme.secondaryBackground,
          borderRadius: BORDER_RADIUS_PRIMARY,
          ...containerStyle
        },
        isLast ? spacings.mb0 : spacings.mbTy
      ]}
    >
      <View
        style={[
          spacings.phSm,
          spacings.pvTy,
          flexbox.directionRow,
          flexbox.justifySpaceBetween,
          flexbox.alignCenter,
          flexbox.flex1,
          { minHeight: itemHeight },
          style
        ]}
      >
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            singleLineLabel && { flex: 1, minWidth: 0 },
            !!showExportImport && !isKeyAmbireV1 && spacings.mrSm
          ]}
        >
          {/* First in the row, like the expand arrow of the calls on the sign transaction screen */}
          {!!isImported && !!canExportOrImportKey && (
            <AnimatedPressable
              onPress={handleToggleDetails}
              style={[flexbox.center, spacings.mrTy, { width: 28, height: 24 }]}
              accessibilityRole="button"
              accessibilityLabel={isShowingDetails ? t('Hide key details') : t('Show key details')}
              {...bindKeyDetailsAnim}
            >
              <Animated.View style={keyDetailsAnimStyles}>
                {isShowingDetails ? <UpArrowIcon /> : <DownArrowIcon />}
              </Animated.View>
            </AnimatedPressable>
          )}
          {!!isImported && (
            <View style={spacings.mrMi}>
              <AccountKeyIcon iconSize={24} type={type || 'internal'} color={keyIconColor} />
            </View>
          )}

          <>
            <View
              style={singleLineLabel && { flex: 1, minWidth: 0 }}
              dataSet={createGlobalTooltipDataSet({
                id: `key-${addr}-${type}-tooltip`,
                content: tooltipContent ?? addr
              })}
            >
              <Text
                color={dedicatedToOneSA ? theme.infoDecorative : theme.primaryText}
                fontSize={fontSize - 1}
                weight={dedicatedToOneSA ? 'semiBold' : 'regular'}
                numberOfLines={singleLineLabel ? 1 : undefined}
                ellipsizeMode={singleLineLabel ? 'middle' : undefined}
                style={[
                  label || isImported ? spacings.mlMi : {},
                  // Reduce the letter spacing as a hack to be able to fit all elements
                  // on the row, even for the extreme case when the key label is max length
                  dedicatedToOneSA && { letterSpacing: -0.2 }
                ]}
              >
                {dedicatedToOneSA ? t('(dedicated key)') : label ? `${label}` : shortAddr}
              </Text>
            </View>
            {!!showCopyAddr && (
              <AnimatedPressable
                style={[spacings.mlMi, copyIconAnimStyle]}
                onPress={handleCopy}
                {...bindCopyIconAnim}
              >
                <CopyIcon width={fontSize + 2} height={fontSize + 2} color={theme.secondaryText} />
              </AnimatedPressable>
            )}
            {onChains && onChains.length && (
              <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mlTy]}>
                {onChains.map((c, i) => (
                  <NetworkIcon
                    key={c}
                    id={c.toString()}
                    style={i === 0 ? { marginLeft: 0 } : { marginLeft: -11 }}
                    size={20}
                  />
                ))}
              </View>
            )}
          </>
        </View>

        {!!canExportOrImportKey && (
          <View>
            {isImported ? (
              <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                {!!menuItems.length && (
                  <View>
                    <Dropdown
                      data={menuItems}
                      externalPosition={menuPosition}
                      setExternalPosition={setMenuPosition}
                      onSelect={handleMenuSelect}
                      kebabIconProps={{ width: 24, height: 24 }}
                      testID={`key-options-${addr}-${type}`}
                    />
                  </View>
                )}
              </View>
            ) : (
              <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                <Button
                  onPress={reimportAccount}
                  size="small"
                  type="secondary"
                  text={t('Import')}
                  style={{ height: 32 }}
                  hasBottomSpacing={false}
                >
                  <ImportIcon
                    style={[spacings.mlTy]}
                    color={theme.primary}
                    width={16}
                    height={16}
                  />
                </Button>
              </View>
            )}
          </View>
        )}
      </View>
      {!!isImported && !isSupported && (
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            spacings.phSm,
            spacings.mbTy,
            { marginTop: -SPACING_MI }
          ]}
        >
          <WarningIcon width={14} height={14} color={theme.warningText} />
          <Text fontSize={12} weight="medium" color={theme.warningText} style={spacings.mlMi}>
            {t("{{device}} key can't sign on this device", {
              device: type ? getKeyDeviceName(type) : ''
            })}
          </Text>
        </View>
      )}
      {!!isKeyAmbireV1 && (
        <View style={[spacings.phSm, spacings.mbTy]}>
          <Text appearance="secondaryText" weight="medium" fontSize={14} numberOfLines={2}>
            {t('(Email signers cannot be imported in Ambire v2)')}
          </Text>
        </View>
      )}
      {!!isShowingDetails && (
        <AccountKeyDetails details={{ type, addr, label, isImported, meta, dedicatedToOneSA }} />
      )}
      {!onExportKeyPress && (
        <BottomSheet
          sheetRef={sheetRefExportKey}
          id="confirm-password-bottom-sheet"
          type={isWeb ? 'modal' : 'bottom-sheet'}
          closeBottomSheet={closeExportKey}
          scrollViewProps={isWeb ? { contentContainerStyle: { flex: 1 } } : undefined}
          containerInnerWrapperStyles={{ flex: 1 }}
          style={isWeb ? { maxWidth: 432, minHeight: 432, ...spacings.pvLg } : undefined}
        >
          <ExportKey
            account={account}
            keyAddr={addr}
            keyLabel={label}
            onBackButtonPress={closeExportKey}
          />
        </BottomSheet>
      )}
    </View>
  )
}

export default React.memo(AccountKey)

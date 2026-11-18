import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { AMBIRE_V1_QUICK_ACC_MANAGER } from '@ambire-common/consts/addresses'
import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import CopyIcon from '@common/assets/svg/CopyIcon'
import ExportIcon from '@common/assets/svg/ExportIcon'
import ImportArrowIcon from '@common/assets/svg/ImportArrowIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import AccountKeyIcon from '@common/components/AccountKeyIcon'
import AccountKeyDetails from '@common/components/AccountKeysBottomSheet/AccountKeyDetails'
import Badge from '@common/components/Badge'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import ExportKey from '@common/components/ExportKey'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import AccountRow from '@common/modules/account-select/components/Account'
import { isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useHover, { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_MI } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import { getUiType } from '@common/utils/uiType'

export type AccountKeyType = {
  isImported: boolean
  addr: Key['addr']
  dedicatedToOneSA: Key['dedicatedToOneSA']
  type?: Key['type']
  meta?: Key['meta']
  label?: string
  onChains?: bigint[]
}

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
  singleLineLabel?: boolean
  /**
   * Shows the key as a row of the account list: the name, the address below it, and a badge
   * that tells what the key is. With no name, the address is the title. A dedicated key also
   * shows its address
   */
  withNameAndAddress?: boolean
  /** The contact, account or key label to show above the address, with `withNameAndAddress` */
  name?: string
  /** The wallet account at the key's address, if there is one, with `withNameAndAddress` */
  ownerAccount?: Account
}

const { isPopup } = getUiType()
/** Short enough for the address to fit next to the Export / Import buttons */
const KEY_ADDRESS_MAX_LENGTH = 20
/** The chain icons in the "Owner on" badge, as small as in the "Safe active on" badge */
const OWNER_CHAIN_ICON_SIZE = 14
const OWNER_CHAIN_ICON_OVERLAP = 5

// A compact view shows a full-width bottom sheet, so only a wider layout gets the minimum height.
// The popup is barely wider than the width cap, so the modal there takes the popup's full width
// instead of leaving a thin gap on each side
const WIDE_LAYOUT_SHEET_STYLE = {
  minHeight: 432,
  ...spacings.pvLg,
  ...(isPopup ? {} : { maxWidth: 432 })
}

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
  singleLineLabel = false,
  withNameAndAddress = false,
  name,
  ownerAccount
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const { isCompactLayout } = useCompactLayout()

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

  const networkIcons = !!onChains?.length && (
    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
      {onChains.map((c, i) => (
        <NetworkIcon
          key={c}
          id={c.toString()}
          style={i === 0 ? { marginLeft: 0 } : { marginLeft: -11 }}
          size={20}
        />
      ))}
    </View>
  )
  const actionsSpacing = !!showExportImport && !isKeyAmbireV1 && spacings.mrSm
  // The owners of a Safe have details even when they are not imported, e.g. its networks
  const safeAccount = account.safeCreation ? account : undefined
  const hasDetails = !!canExportOrImportKey && (isImported || !!safeAccount)
  // On mobile the account row shows its copy button next to the actions, so the arrow goes to the
  // end of the badges row, below the copy button, not next to it, where the two icons crowd
  const isDetailsToggleWithBadges = withNameAndAddress && !isWeb
  const detailsToggle = (
    <AnimatedPressable
      onPress={handleToggleDetails}
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        !isDetailsToggleWithBadges && spacings.mlSm
      ]}
      {...bindKeyDetailsAnim}
    >
      <Animated.View style={keyDetailsAnimStyles}>
        <RightArrowIcon
          width={16}
          height={16}
          color={theme.secondaryText}
          style={
            isShowingDetails
              ? { transform: [{ rotate: '270deg' }] }
              : { transform: [{ rotate: '90deg' }] }
          }
        />
      </Animated.View>
    </AnimatedPressable>
  )
  const keyActions = !!canExportOrImportKey && (
    <View>
      {isImported ? (
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <View>
            {/*
          When making the Pressable disabled, it disables literally everything in it.
          So even the tooltip will not work.
          The workaround is to set a wrapping <View> and make it the tooltip target
        */}
            <View
              dataSet={createGlobalTooltipDataSet({
                id: `export-${addr}-${type}-tooltip`,
                content: t('Export unavailable as this is a hardware wallet key'),
                hidden: canExportKey
              })}
            >
              <Button
                testID={`export-key-button-${addr}`}
                style={{ height: 32 }}
                hasBottomSpacing={false}
                onPress={handleExportKeyPress}
                size="small"
                disabled={!canExportKey}
                type="secondary"
                text={t('Export')}
              >
                <ExportIcon
                  style={spacings.mlTy}
                  color={theme.iconPrimary}
                  width={16}
                  height={16}
                />
              </Button>
            </View>
          </View>
          {!isDetailsToggleWithBadges && detailsToggle}
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
            <ImportArrowIcon style={spacings.mlTy} color={theme.primary} width={16} height={16} />
          </Button>
          {!isDetailsToggleWithBadges && hasDetails && detailsToggle}
        </View>
      )}
    </View>
  )

  // The key as an account, so it is shown like one: under the name it has in the wallet,
  // with the badge of its keys, or with only its address when it has no name
  const keyAsAccount = useMemo((): Account => {
    const rowLabel = dedicatedToOneSA ? t('(dedicated key)') : name || ''

    if (ownerAccount) {
      return { ...ownerAccount, preferences: { ...ownerAccount.preferences, label: rowLabel } }
    }

    return {
      addr,
      associatedKeys: [addr],
      initialPrivileges: [],
      creation: null,
      preferences: { label: rowLabel, pfp: addr }
    }
  }, [addr, dedicatedToOneSA, name, ownerAccount, t])
  const renderKeyActions = () => keyActions
  const renderDetailsToggleWithBadges = () => hasDetails && detailsToggle
  // Labeled, as the owner may be a Safe of the wallet, deployed on other chains than these
  const renderOwnerNetworksBadge = () =>
    !!onChains?.length && (
      <Badge type="info" style={{ columnGap: SPACING_MI, paddingRight: SPACING_MI }}>
        <Text fontSize={12} weight="medium" color={theme.infoText} numberOfLines={1}>
          {t('Owner on')}
        </Text>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          {onChains.map((chainId, index) => (
            <NetworkIcon
              key={chainId}
              id={chainId.toString()}
              size={OWNER_CHAIN_ICON_SIZE}
              style={{ marginLeft: index ? -OWNER_CHAIN_ICON_OVERLAP : 0 }}
            />
          ))}
        </View>
      </Badge>
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
      {withNameAndAddress ? (
        <AccountRow
          account={keyAsAccount}
          withSettings={false}
          // Pressing anywhere on the row opens the details, not only on the arrow
          isSelectable={hasDetails}
          onSelect={hasDetails ? handleToggleDetails : undefined}
          switchAccountOnPress={false}
          withBalance={false}
          maxAccountAddrLength={KEY_ADDRESS_MAX_LENGTH}
          renderRightChildren={renderKeyActions}
          renderBadgesEndChildren={
            isDetailsToggleWithBadges ? renderDetailsToggleWithBadges : undefined
          }
          renderExtraBadges={renderOwnerNetworksBadge}
          withAccountStatus={false}
          containerStyle={spacings.mb0}
        />
      ) : (
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
              actionsSpacing
            ]}
          >
            {!!isImported && (
              <View style={spacings.mrTy}>
                <AccountKeyIcon iconSize={20} type={type || 'internal'} color={keyIconColor} />
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
                  <CopyIcon
                    width={fontSize + 2}
                    height={fontSize + 2}
                    color={theme.secondaryText}
                  />
                </AnimatedPressable>
              )}
              {!!networkIcons && <View style={spacings.mlTy}>{networkIcons}</View>}
            </>
          </View>

          {keyActions}
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
        <AccountKeyDetails
          details={{ type, addr, label, isImported, meta, dedicatedToOneSA, onChains }}
          safeAccount={safeAccount}
        />
      )}
      {!onExportKeyPress && (
        <BottomSheet
          sheetRef={sheetRefExportKey}
          id="confirm-password-bottom-sheet"
          type={isWeb ? 'modal' : 'bottom-sheet'}
          closeBottomSheet={closeExportKey}
          scrollViewProps={isWeb ? { contentContainerStyle: { flex: 1 } } : undefined}
          containerInnerWrapperStyles={{ flex: 1 }}
          style={isCompactLayout ? undefined : WIDE_LAYOUT_SHEET_STYLE}
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

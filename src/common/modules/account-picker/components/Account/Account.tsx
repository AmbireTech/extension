import React, { useCallback, useMemo } from 'react'
import { Pressable, View } from 'react-native'

import { HARDWARE_WALLET_DEVICE_NAMES } from '@ambire-common/consts/hardwareWallets'
import {
  Account as AccountInterface,
  AccountWithNetworkMeta,
  ImportStatus
} from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import { isAmbireV1LinkedAccount } from '@ambire-common/libs/account/account'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import CopyIcon from '@common/assets/svg/CopyIcon'
import Avatar from '@common/components/Avatar'
import Badge from '@common/components/Badge'
import BadgeWithPreset from '@common/components/BadgeWithPreset'
import FatToggle from '@common/components/FatToggle'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Label from '@common/components/Label'
import NetworkIcon from '@common/components/NetworkIcon'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'

import getStyles from './styles'

const Account = ({
  account,
  type,
  unused,
  withBottomSpacing = true,
  isSelected,
  onSelect,
  onDeselect,
  isDisabled,
  importStatus,
  importedKeyTypes,
  associatedKeysStats,
  currentKeyType,
  displayTypeBadge = true,
  displayTypePill = true,
  shouldBeDisplayedAsNew = false,
  identityDisplayMode = 'responsive',
  selectOnRowPress = true,
  footer
}: {
  account: AccountWithNetworkMeta
  type: 'basic' | 'smart' | 'linked'
  unused: boolean
  isSelected: boolean
  withBottomSpacing: boolean
  onSelect: (account: AccountInterface) => void
  onDeselect: (account: AccountInterface) => void
  isDisabled?: boolean
  importStatus: ImportStatus
  /** The key types this account is already imported with, if any. */
  importedKeyTypes?: Key['type'][]
  /** How many keys can sign for this account and how many of them are imported. */
  associatedKeysStats?: { total: number; imported: number }
  /** The key type the user is importing with right now. */
  currentKeyType?: Key['type']
  displayTypeBadge?: boolean
  displayTypePill?: boolean
  shouldBeDisplayedAsNew?: boolean
  identityDisplayMode?: 'responsive' | 'compact'
  selectOnRowPress?: boolean
  footer?: React.ReactNode
}) => {
  const { isLoading: isDomainResolving, name: reverseLookupName } = useReverseLookup({
    address: account.addr
  })
  const { t } = useTranslation()
  const { styles, theme, themeType } = useTheme(getStyles)
  const { minWidthSize, maxWidthSize } = useWindowSize()
  const { addToast } = useToast()
  const isAccountImported = importStatus !== ImportStatus.NotImported
  const usedOnNetworks = Array.isArray(account.usedOnNetworks) ? account.usedOnNetworks : undefined
  const isUsedOnNetworksLoading = account.usedOnNetworks !== null && !usedOnNetworks
  const hasUsedOnNetworks = !!usedOnNetworks && usedOnNetworks.length > 0
  const shouldShowUsedOnNetworks =
    identityDisplayMode === 'responsive' &&
    !unused &&
    (hasUsedOnNetworks || isUsedOnNetworksLoading)

  const handleSelectionChange = useCallback(
    (shouldSelect: boolean) => {
      if (shouldSelect) {
        onSelect(account)
      } else {
        onDeselect(account)
      }
    },
    [account, onDeselect, onSelect]
  )

  const handlePress = useCallback(() => {
    handleSelectionChange(!isSelected)
  }, [handleSelectionChange, isSelected])

  const formattedAddress = useMemo(() => {
    if (identityDisplayMode === 'compact') return shortenAddress(account.addr, 16)
    if (minWidthSize('m') || reverseLookupName || isDomainResolving) {
      return shortenAddress(account.addr, 16)
    }
    if (maxWidthSize('m') && minWidthSize('l')) {
      return shortenAddress(account.addr, 26)
    }
    if (maxWidthSize('l')) {
      return account.addr
    }
    return shortenAddress(account.addr, 16)
  }, [
    account.addr,
    identityDisplayMode,
    reverseLookupName,
    isDomainResolving,
    maxWidthSize,
    minWidthSize
  ])

  const shouldShowImportedAddress =
    !account.preferences.label || (!isMobile && identityDisplayMode === 'responsive')
  const identityFontSize = identityDisplayMode === 'compact' ? 14 : 16
  const isCompactWebIdentity = isWeb && identityDisplayMode === 'compact'
  const compactIdentityTooltipDataSet = useMemo(
    () =>
      isCompactWebIdentity
        ? createGlobalTooltipDataSet({
            id: `account-picker-identity-${account.addr}`,
            content: account.addr
          })
        : undefined,
    [account.addr, isCompactWebIdentity]
  )
  const shouldShowOnlyResolvedName = isCompactWebIdentity && !!reverseLookupName

  const getKeyTypeLabel = useCallback(
    (keyType: Key['type']) =>
      keyType === 'internal'
        ? t('recovery phrase or private key')
        : t('{{deviceName}} key', { deviceName: HARDWARE_WALLET_DEVICE_NAMES[keyType] }),
    [t]
  )
  const importedKeyTypesLabel = useMemo(() => {
    if (!importedKeyTypes?.length) return t('existing key')

    const labels = importedKeyTypes.map(getKeyTypeLabel)
    if (labels.length === 1) return labels[0]

    return t('{{allButLast}} and {{last}}', {
      allButLast: labels.slice(0, -1).join(', '),
      last: labels[labels.length - 1]
    })
  }, [getKeyTypeLabel, importedKeyTypes, t])
  const currentKeyTypeLabel = useMemo(
    () => (currentKeyType ? getKeyTypeLabel(currentKeyType) : t('key')),
    [currentKeyType, getKeyTypeLabel, t]
  )

  const backgroundColor = useMemo(() => {
    if (identityDisplayMode === 'compact') return theme.secondaryBackground

    return themeType === THEME_TYPES.DARK ? theme.neutral400 : theme.neutral200
  }, [identityDisplayMode, theme, themeType])

  const handleCopyAddress = useCallback(() => {
    setStringAsync(account.addr)
    addToast(t('Address copied to clipboard!') as string, { timeout: 2500 })
  }, [account.addr, addToast, t])

  if (!account.addr) return null

  return (
    <Pressable
      key={account.addr}
      style={[
        flexbox.alignCenter,
        withBottomSpacing ? spacings.mbTy : spacings.mb0,
        common.borderRadiusPrimary,
        common.hidden,
        // @ts-expect-error react-native-web supports `cursor`, but it's missing from React Native StyleProp<ViewStyle> types
        isWeb && !selectOnRowPress && { cursor: 'default' },
        { backgroundColor }
      ]}
      onPress={isDisabled || !selectOnRowPress ? undefined : handlePress}
      testID={`add-account-${account.addr}`}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: theme.secondaryBackground },
          isMobile && type === 'linked' && { backgroundColor: theme.infoBackground }
        ]}
      >
        <FatToggle
          id={`add-account-toggle-${account.addr}`}
          isOn={isSelected}
          onToggle={handleSelectionChange}
          disabled={isDisabled}
          stopPropagation
          style={flexbox.alignSelfStart}
          width={44}
          height={24}
        />

        <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
          <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                isMobile ? spacings.mrTy : spacings.mrMd,
                // Lets the row shrink below its content's natural width so the name can truncate
                { flexShrink: 1, minWidth: 0 }
              ]}
            >
              {isAccountImported ? (
                <>
                  <Avatar
                    address={account.addr}
                    pfp={account.preferences.pfp}
                    size={24}
                    smartAccountType={
                      (account.creation && 'Ambire') || (account.safeCreation && 'Safe')
                    }
                    displayTypeBadge={displayTypeBadge}
                  />
                  <Text
                    fontSize={identityFontSize}
                    weight="medium"
                    appearance={isMobile && type === 'linked' ? 'infoText' : 'primaryText'}
                    style={[spacings.mrTy, { flexShrink: 1, minWidth: 0 }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    dataSet={compactIdentityTooltipDataSet}
                  >
                    {account.preferences.label}
                  </Text>
                  {shouldShowImportedAddress && (
                    <Text
                      fontSize={14}
                      appearance="secondaryText"
                      style={spacings.mrMi}
                      dataSet={createGlobalTooltipDataSet({
                        id: account.addr,
                        content: account.addr
                      })}
                      weight="mono_regular"
                    >
                      ({shortenAddress(account.addr, 16)})
                    </Text>
                  )}
                </>
              ) : (
                <>
                  {reverseLookupName ? (
                    <Text
                      fontSize={identityFontSize}
                      weight="medium"
                      appearance={isMobile && type === 'linked' ? 'infoText' : 'primaryText'}
                      style={[spacings.mrTy, { flexShrink: 1, minWidth: 0 }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      dataSet={compactIdentityTooltipDataSet}
                    >
                      {reverseLookupName}
                    </Text>
                  ) : isWeb && isDomainResolving ? (
                    <Text fontSize={14} appearance="secondaryText" style={spacings.mrTy}>
                      {t('Resolving domain...')}
                    </Text>
                  ) : null}
                  {!shouldShowOnlyResolvedName && (
                    <Text
                      fontSize={14}
                      appearance={isMobile && type === 'linked' ? 'infoText' : 'secondaryText'}
                      style={spacings.mrMi}
                      weight="mono_regular"
                    >
                      {reverseLookupName || (isWeb && isDomainResolving) ? '(' : ''}
                      {formattedAddress}
                      {reverseLookupName || (isWeb && isDomainResolving) ? ')' : ''}
                    </Text>
                  )}
                </>
              )}

              {!isMobile && (maxWidthSize('l') || isAccountImported || reverseLookupName) && (
                <Pressable style={{ cursor: 'pointer' }} onPress={handleCopyAddress}>
                  <CopyIcon width={14} height={14} />
                </Pressable>
              )}
            </View>
            {displayTypePill && (
              <>
                {type === 'smart' && (
                  <BadgeWithPreset style={spacings.mrMi} preset="smart-account" />
                )}

                {isWeb && type === 'linked' && (
                  <>
                    <BadgeWithPreset preset="linked" style={spacings.mrMi} />
                    {isAmbireV1LinkedAccount(account.creation?.factoryAddr) && (
                      <BadgeWithPreset preset="ambire-v1" style={spacings.mrMi} />
                    )}
                  </>
                )}
              </>
            )}
          </View>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            {shouldShowUsedOnNetworks && isMobile && (
              <Badge
                style={{
                  borderWidth: 1,
                  borderColor: theme.successDecorative
                }}
                type="success"
                text={t('used')}
              />
            )}
            {shouldShowUsedOnNetworks && !isMobile && (
              <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                <Text fontSize={12} weight="regular">
                  {t('used on ')}
                </Text>
                {hasUsedOnNetworks && usedOnNetworks ? (
                  usedOnNetworks.slice(0, 7).map((n, index: number, arr: string | any[]) => {
                    return (
                      <View
                        style={[
                          styles.networkIcon,
                          { marginLeft: index ? -5 : 0, zIndex: arr.length - index }
                        ]}
                        key={n.chainId.toString()}
                      >
                        <NetworkIcon
                          style={{ backgroundColor: '#fff' }}
                          id={n.chainId.toString()}
                          size={18}
                        />
                      </View>
                    )
                  })
                ) : (
                  <SkeletonLoader
                    width={54}
                    height={20}
                    borderRadius={6}
                    appearance="tertiaryBackground"
                  />
                )}
              </View>
            )}
            {!!unused && (
              <Badge
                type={shouldBeDisplayedAsNew ? 'new' : 'outline'}
                text={shouldBeDisplayedAsNew ? t('New') : t('unused')}
              />
            )}
          </View>
        </View>
      </View>
      {footer}
      {[
        ImportStatus.ImportedWithSomeOfTheKeys,
        ImportStatus.ImportedWithDifferentKeys,
        ImportStatus.ImportedWithoutKey
      ].includes(importStatus) && (
        <View
          style={[
            spacings.mh,
            spacings.mvTy,
            isMobile ? { alignSelf: 'stretch' } : flexbox.alignSelfStart
          ]}
        >
          {importStatus === ImportStatus.ImportedWithSomeOfTheKeys && !!associatedKeysStats && (
            <Label
              isTypeLabelHidden
              customTextStyle={styles.label}
              hasBottomSpacing={false}
              text={t(
                'This account has {{total}} keys, {{imported}} of them already imported. Import again to add the ones found on this page.',
                associatedKeysStats
              )}
              type="success"
            />
          )}
          {importStatus === ImportStatus.ImportedWithDifferentKeys && (
            <Label
              isTypeLabelHidden
              customTextStyle={styles.label}
              hasBottomSpacing={false}
              text={t(
                'Already imported with your {{importedKeyTypesLabel}}. Import again to also sign with this {{currentKeyTypeLabel}}.',
                { importedKeyTypesLabel, currentKeyTypeLabel }
              )}
              type="info"
            />
          )}
          {importStatus === ImportStatus.ImportedWithoutKey && (
            <Label
              isTypeLabelHidden
              customTextStyle={styles.label}
              hasBottomSpacing={false}
              text={t('Already imported as view-only. Import now to be able to sign.')}
              type="info"
            />
          )}
        </View>
      )}
    </Pressable>
  )
}

export default React.memo(Account)

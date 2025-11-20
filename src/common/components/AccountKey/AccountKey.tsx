import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { AMBIRE_V1_QUICK_ACC_MANAGER } from '@ambire-common/consts/addresses'
import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import CopyIcon from '@common/assets/svg/CopyIcon'
import ExportIcon from '@common/assets/svg/ExportIcon'
import ImportIcon from '@common/assets/svg/ImportIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import AccountKeyIcon from '@common/components/AccountKeyIcon'
import AccountKeyDetails from '@common/components/AccountKeysBottomSheet/AccountKeyDetails'
import Badge from '@common/components/Badge'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Editable from '@common/components/Editable'
import ExportKey from '@common/components/ExportKey'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useHover, { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import { getUiType } from '@web/utils/uiType'

import { createGlobalTooltipDataSet } from '../GlobalTooltip'

export type AccountKeyType = {
  isImported: boolean
  addr: Key['addr']
  dedicatedToOneSA: Key['dedicatedToOneSA']
  type?: Key['type']
  meta?: Key['meta']
  label?: string
}

type Props = AccountKeyType & {
  isLast?: boolean
  style?: ViewStyle
  enableEditing?: boolean
  openAddAccountBottomSheet?: () => void
  showCopyAddr?: boolean
  account: Account
  keyIconColor?: string
  showExportImport?: boolean
}

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
  enableEditing = true,
  openAddAccountBottomSheet,
  account,
  meta,
  keyIconColor,
  showExportImport = false
}) => {
  const [isImporting, setIsImporting] = useState<boolean>(false)
  const { t } = useTranslation()
  const { theme, themeType } = useTheme()
  const { addToast } = useToast()
  const { dispatch } = useBackgroundService()
  const [isEditing, setIsEditing] = useState(false)

  const [bindKeyDetailsAnim, keyDetailsAnimStyles] = useCustomHover({
    property: 'bottom',
    values: { from: 0, to: -2 }
  })
  const { ref: sheetRefExportKey, open: openExportKey, close: closeExportKey } = useModalize()
  const [bindCopyIconAnim, copyIconAnimStyle] = useHover({
    preset: 'opacityInverted'
  })
  const fontSize = isPopup ? 14 : 16
  const isKeyAmbireV1 = addr === AMBIRE_V1_QUICK_ACC_MANAGER
  const canExportOrImportKey = showExportImport && !isKeyAmbireV1
  const [isShowingDetails, setIsShowingDetails] = useState<boolean>(false)

  const handleCopy = async () => {
    try {
      await setStringAsync(addr)
      addToast(t('Key address copied to clipboard'), { type: 'success' })
    } catch {
      addToast(t('Could not copy the key address to the clipboard'), { type: 'error' })
    }
  }

  const editKeyLabel = (newLabel: string) => {
    dispatch({
      type: 'KEYSTORE_CONTROLLER_UPDATE_KEY_PREFERENCES',
      params: [{ addr, type: type || 'internal', preferences: { label: newLabel } }]
    })
    addToast(t('Key label updated'), { type: 'success' })
  }

  const shortAddr = shortenAddress(addr, 13)

  const isInternal = !type || type === 'internal'
  const canExportKey = isImported && isInternal

  const importKey = () => {
    setIsImporting(true)
  }
  const reimportAccount = () => {
    if (openAddAccountBottomSheet) openAddAccountBottomSheet()
  }

  return (
    <View
      style={[
        {
          backgroundColor:
            themeType === THEME_TYPES.DARK ? theme.primaryBackground : theme.secondaryBackground,
          borderRadius: BORDER_RADIUS_PRIMARY
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
          { minHeight: 48 },
          style
        ]}
      >
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.flex1,
            !!showExportImport && !isKeyAmbireV1 && spacings.mrSm
          ]}
        >
          {!!isImported && (
            <View style={spacings.mrTy}>
              <AccountKeyIcon type={type || 'internal'} color={keyIconColor} />
            </View>
          )}

          {/* Keys that aren't imported can't be labeled */}
          {isImported && enableEditing ? (
            <Editable
              textProps={{ weight: 'semiBold' }}
              fontSize={fontSize}
              initialValue={label || ''}
              onSave={editKeyLabel}
              maxLength={40}
              onSetIsEditing={setIsEditing}
            />
          ) : (
            <Text weight="semiBold" fontSize={fontSize} numberOfLines={1}>
              {label}
            </Text>
          )}

          {!isEditing && (
            <>
              <View
                // @ts-ignore
                dataSet={createGlobalTooltipDataSet({
                  id: `key-${addr}-tooltip`,
                  content: addr
                })}
              >
                <Text
                  color={dedicatedToOneSA ? theme.infoDecorative : theme.primaryText}
                  fontSize={fontSize - 1}
                  weight={dedicatedToOneSA ? 'semiBold' : 'regular'}
                  style={[
                    label || isImported ? spacings.mlMi : {},
                    // Reduce the letter spacing as a hack to be able to fit all elements
                    // on the row, even for the extreme case when the key label is max length
                    dedicatedToOneSA && { letterSpacing: -0.2 }
                  ]}
                >
                  {dedicatedToOneSA ? t('(dedicated key)') : label ? `(${shortAddr})` : shortAddr}
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
              {!isImported && (
                <View style={spacings.mlTy}>
                  <Badge type="warning" text={t('Not imported')} />
                </View>
              )}
            </>
          )}
        </View>

        {!isEditing && !!canExportOrImportKey && (
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
                    // @ts-ignore
                    dataSet={createGlobalTooltipDataSet({
                      id: `export-${addr}-tooltip`,
                      content: t('Export unavailable as this is a hardware wallet key'),
                      hidden: canExportKey
                    })}
                  >
                    <Button
                      style={{ height: 32 }}
                      hasBottomSpacing={false}
                      onPress={openExportKey as any}
                      size="small"
                      disabled={!canExportKey}
                      type="secondary"
                      text={t('Export')}
                    >
                      <ExportIcon
                        style={[spacings.mlTy]}
                        color={theme.primary}
                        width={16}
                        height={16}
                      />
                    </Button>
                  </View>
                </View>
                <AnimatedPressable
                  onPress={() => {
                    setIsShowingDetails((p) => !p)
                  }}
                  style={[flexbox.directionRow, flexbox.alignCenter, spacings.mlSm]}
                  {...bindKeyDetailsAnim}
                >
                  <Animated.View style={keyDetailsAnimStyles}>
                    <RightArrowIcon
                      width={16}
                      height={16}
                      color={theme.secondaryText}
                      // @ts-ignore
                      style={
                        isShowingDetails
                          ? { transform: 'rotate(270deg)' }
                          : { transform: 'rotate(90deg)' }
                      }
                    />
                  </Animated.View>
                </AnimatedPressable>
              </View>
            ) : (
              <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                <Button
                  onPress={importKey}
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
      {!!canExportOrImportKey && !!isImporting && !!openAddAccountBottomSheet && (
        <View
          style={[
            spacings.phSm,
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.justifySpaceBetween,
            spacings.mbSm
          ]}
        >
          <Text fontSize={14} appearance="secondaryText">
            {t('To import this key, you have to reimport the account.')}
          </Text>
          <Button
            onPress={reimportAccount}
            size="small"
            style={{ height: 32, ...spacings.mlTy }}
            text={t('Reimport account')}
            hasBottomSpacing={false}
          />
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
      <BottomSheet
        sheetRef={sheetRefExportKey}
        id="confirm-password-bottom-sheet"
        type="modal"
        backgroundColor={
          themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'
        }
        closeBottomSheet={closeExportKey}
        scrollViewProps={{ contentContainerStyle: { flex: 1 } }}
        containerInnerWrapperStyles={{ flex: 1 }}
        style={{ maxWidth: 432, minHeight: 432, ...spacings.pvLg }}
      >
        <ExportKey
          account={account}
          keyAddr={addr}
          keyLabel={label}
          onBackButtonPress={closeExportKey}
        />
      </BottomSheet>
    </View>
  )
}

export default React.memo(AccountKey)

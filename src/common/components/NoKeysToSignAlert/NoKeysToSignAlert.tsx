import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import NoKeysIcon from '@common/assets/svg/NoKeysIcon'
import AccountKeysBottomSheet from '@common/components/AccountKeysBottomSheet'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useUnsupportedAccountKeys from '@common/hooks/useUnsupportedAccountKeys'
import AddAccount from '@common/modules/account-select/components/AddAccount'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import joinNames from '@common/utils/joinNames'
import { getKeyDeviceName } from '@common/utils/keys'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'
import type { TFunction } from 'i18next'

interface Props {
  style?: ViewStyle
  isTransaction?: boolean
  type?: 'long' | 'short'
  chainId?: bigint
}

const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account

/**
 * The alert's copy for an account whose keys on this network were all synced from a device that
 * supports them, e.g. a GridPlus key on mobile. A Safe's keys are its owners, so they are named so
 */
const getUnsupportedKeysCopy = ({
  devices,
  count,
  isSafe,
  t
}: {
  devices: string
  count: number
  isSafe: boolean
  t: TFunction
}) => {
  if (isSafe && count > 1)
    return {
      title: t("Your {{devices}} owners can't sign on this device", { devices }),
      text: t(
        "This Safe's {{devices}} owners were synced from another device, but these types of keys aren't supported on this device. Import them from another source to sign here, or remove them in Manage owners.",
        { devices }
      )
    }
  if (isSafe)
    return {
      title: t("Your {{devices}} owner can't sign on this device", { devices }),
      text: t(
        "This Safe's {{devices}} owner was synced from another device, but {{devices}} keys aren't supported on this device. Import it from another source to sign here, or remove it in Manage owners.",
        { devices }
      )
    }
  if (count > 1)
    return {
      title: t("Your {{devices}} keys can't sign on this device", { devices }),
      text: t(
        "This account's {{devices}} keys were synced from another device, but these types of keys aren't supported on this device. Import them from another source to sign here, or remove them in Manage keys.",
        { devices }
      )
    }
  return {
    title: t("Your {{devices}} key can't sign on this device", { devices }),
    text: t(
      "This account's {{devices}} key was synced from another device, but {{devices}} keys aren't supported on this device. Import it from another source to sign here, or remove it in Manage keys.",
      { devices }
    )
  }
}

const NoKeysToSignAlert: FC<Props> = ({ style, isTransaction = true, type = 'long', chainId }) => {
  const { state: account } = useController('SelectedAccountController', selectAccount)
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { ref: addAccountsRef, open: openAddAccounts, close: closeAddAccounts } = useModalize()
  const unsupportedKeys = useUnsupportedAccountKeys(account, chainId)
  const { t } = useTranslation()
  const { theme } = useTheme()

  /**
   * The names of the devices behind the account's keys that this device can't sign with,
   * e.g. a GridPlus key synced from the extension. Empty when the account has no such keys.
   */
  const { unsupportedDeviceNames, unsupportedDeviceCount } = useMemo(() => {
    const types = new Set(unsupportedKeys.map((key) => key.type))
    const names = Array.from(types).map(getKeyDeviceName)
    return { unsupportedDeviceNames: joinNames(names, t), unsupportedDeviceCount: names.length }
  }, [t, unsupportedKeys])

  // should never happen (selected account details are always present)
  if (!account) return null

  const isSafe = !!account.safeCreation
  const unsupportedKeysCopy =
    !!unsupportedDeviceNames &&
    getUnsupportedKeysCopy({
      devices: unsupportedDeviceNames,
      count: unsupportedDeviceCount,
      isSafe,
      t
    })
  const noKeysTitle = isSafe
    ? t(`No owners imported to sign this ${isTransaction ? 'transaction' : 'message'}`)
    : t(`No keys available to sign this ${isTransaction ? 'transaction' : 'message'}`)
  const noKeysText = isSafe
    ? t('Import your Safe account owners')
    : t(
        "This account was imported in view-only mode, which means that there isn't an imported key that can sign for this account. \nIf you do have such a key, please re-import the account with it."
      )
  const title = unsupportedKeysCopy ? unsupportedKeysCopy.title : noKeysTitle

  return (
    <View style={{ display: 'flex', alignContent: 'center', justifyContent: 'center', ...style }}>
      {type === 'short' ? (
        <View
          style={[
            flexbox.directionRow,
            flexbox.center,
            spacings.phTy,
            spacings.pvTy,
            common.borderRadiusPrimary,
            {
              borderWidth: 1,
              backgroundColor: theme.errorBackground,
              borderColor: theme.errorDecorative
            }
          ]}
        >
          <NoKeysIcon />
          <Text
            fontSize={14}
            appearance="primaryText"
            style={[spacings.mhSm, flexbox.flex1, { minWidth: 0 }]}
          >
            {title}
          </Text>
          <Button
            hasBottomSpacing={false}
            size="small"
            type="dangerFilled"
            textStyle={{ fontSize: 12 }}
            onPress={() => openBottomSheet()}
            text={t('Check')}
            style={{ flexShrink: 0 }}
          />
        </View>
      ) : (
        <Alert
          type="error"
          title={title}
          text={unsupportedKeysCopy ? unsupportedKeysCopy.text : noKeysText}
          customIcon={() => <NoKeysIcon />}
          // With a key this device can't use, the keys list would offer nothing to import,
          // so Import goes straight to adding one and the list stays a step away to remove it
          buttonProps={{
            onPress: () => (unsupportedDeviceNames ? openAddAccounts() : openBottomSheet()),
            text: isSafe ? t('Import Owner') : t('Import Key')
          }}
          secondaryButtonProps={
            unsupportedDeviceNames
              ? {
                  type: 'secondary',
                  onPress: () => openBottomSheet(),
                  text: isSafe ? t('Manage owners') : t('Manage keys')
                }
              : undefined
          }
        />
      )}
      <AccountKeysBottomSheet
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        account={account}
        showExportImport
        // Only the keys this device can't sign with, so a key that can sign never vanishes mid-flow
        removableKeys={unsupportedDeviceNames ? 'unsupported' : undefined}
        openAddAccountBottomSheet={openAddAccounts}
        chainId={chainId}
      />
      <AddAccount sheetRef={addAccountsRef} closeBottomSheet={closeAddAccounts} showImportOnly />
    </View>
  )
}

export default React.memo(NoKeysToSignAlert)

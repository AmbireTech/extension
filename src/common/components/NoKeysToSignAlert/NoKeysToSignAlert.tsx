import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { HARDWARE_WALLET_DEVICE_NAMES } from '@ambire-common/consts/hardwareWallets'
import NoKeysIcon from '@common/assets/svg/NoKeysIcon'
import AccountKeysBottomSheet from '@common/components/AccountKeysBottomSheet'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import AddAccount from '@common/modules/account-select/components/AddAccount'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  style?: ViewStyle
  isTransaction?: boolean
  type?: 'long' | 'short'
  chainId?: bigint
}

const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account
const selectUnsupportedKeys = (state: AllControllersMappingType['KeystoreController']) =>
  state.unsupportedKeys

const NoKeysToSignAlert: FC<Props> = ({ style, isTransaction = true, type = 'long', chainId }) => {
  const { state: account } = useController('SelectedAccountController', selectAccount)
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { ref: addAccountsRef, open: openAddAccounts, close: closeAddAccounts } = useModalize()
  const { state: unsupportedKeys } = useController('KeystoreController', selectUnsupportedKeys)
  const { t } = useTranslation()
  const { theme } = useTheme()

  /**
   * The names of the devices behind the account's keys that this device can't sign with,
   * e.g. a GridPlus key synced from the extension. Empty when the account has no such keys.
   */
  const { unsupportedDeviceNames, unsupportedDeviceCount } = useMemo(() => {
    if (!account || account.safeCreation)
      return { unsupportedDeviceNames: '', unsupportedDeviceCount: 0 }
    const types = new Set(
      (unsupportedKeys || [])
        .filter((key) => account.associatedKeys.includes(key.addr))
        .map((key) => key.type)
    )
    const names = Array.from(types).map((type) =>
      type === 'internal' ? type : HARDWARE_WALLET_DEVICE_NAMES[type]
    )
    const joinedNames =
      names.length <= 1
        ? names[0] || ''
        : t('{{names}} and {{lastName}}', {
            names: names.slice(0, -1).join(', '),
            lastName: names[names.length - 1]
          })
    return { unsupportedDeviceNames: joinedNames, unsupportedDeviceCount: names.length }
  }, [account, t, unsupportedKeys])

  // should never happen (selected account details are always present)
  if (!account) return null

  const requestName = isTransaction ? t('transaction') : t('message')
  const unsupportedKeysTitle =
    unsupportedDeviceCount > 1
      ? t("Your {{devices}} keys can't sign on this device", { devices: unsupportedDeviceNames })
      : t("Your {{devices}} key can't sign on this device", { devices: unsupportedDeviceNames })
  const title = unsupportedDeviceNames
    ? unsupportedKeysTitle
    : account.safeCreation
      ? t(`No owners imported to sign this ${isTransaction ? 'transaction' : 'message'}`)
      : t(`No keys available to sign this ${isTransaction ? 'transaction' : 'message'}`)

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
          text={
            unsupportedDeviceNames
              ? t(
                  "This account's key was added on another device, and {{devices}} isn't supported here. Sign this {{request}} on the device where you use {{devices}}, or import another key for this account.",
                  { devices: unsupportedDeviceNames, request: requestName }
                )
              : t(
                  account.safeCreation
                    ? 'Import your Safe account owners'
                    : "This account was imported in view-only mode, which means that there isn't an imported key that can sign for this account. \nIf you do have such a key, please re-import the account with it."
                )
          }
          customIcon={() => <NoKeysIcon />}
          buttonProps={{
            onPress: () => openBottomSheet(),
            text: !!account.safeCreation ? t('Import Owner') : t('Import Key')
          }}
        />
      )}
      <AccountKeysBottomSheet
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        account={account}
        showExportImport
        openAddAccountBottomSheet={openAddAccounts}
        chainId={chainId}
      />
      <AddAccount sheetRef={addAccountsRef} closeBottomSheet={closeAddAccounts} showImportOnly />
    </View>
  )
}

export default React.memo(NoKeysToSignAlert)

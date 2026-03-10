import React, { FC } from 'react'
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
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import AddAccount from '@web/modules/account-select/components/AddAccount'

interface Props {
  style?: ViewStyle
  isTransaction?: boolean
  type?: 'long' | 'short'
  chainId?: bigint
}

const NoKeysToSignAlert: FC<Props> = ({ style, isTransaction = true, type = 'long', chainId }) => {
  const {
    state: { account }
  } = useController('SelectedAccountController')
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { ref: addAccountsRef, open: openAddAccounts, close: closeAddAccounts } = useModalize()
  const { t } = useTranslation()
  const { theme } = useTheme()

  // should never happen (selected account details are always present)
  if (!account) return null

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
          <Text fontSize={14} appearance="errorText" style={spacings.mhSm}>
            {!!account.safeCreation
              ? t(`No owners imported to sign this ${isTransaction ? 'transaction' : 'message'}`)
              : t(`No keys available to sign this ${isTransaction ? 'transaction' : 'message'}`)}
          </Text>
          <Button
            hasBottomSpacing={false}
            size="small"
            type="danger"
            textStyle={{ fontSize: 12 }}
            onPress={() => openBottomSheet()}
            text={t('Check')}
          />
        </View>
      ) : (
        <Alert
          type="error"
          title={
            !!account.safeCreation
              ? t(`No owners imported to sign this ${isTransaction ? 'transaction' : 'message'}`)
              : t(`No keys available to sign this ${isTransaction ? 'transaction' : 'message'}`)
          }
          text={t(
            account.safeCreation
              ? 'Import your Safe account owners'
              : "This account was imported in view-only mode, which means that there isn't an imported key that can sign for this account. \nIf you do have such a key, please re-import the account with it."
          )}
          customIcon={() => <NoKeysIcon />}
          buttonProps={{
            onPress: () => openBottomSheet(),
            text: !!account.safeCreation ? t('Import Owner') : t('Import Key'),
            type: 'dangerFilled'
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

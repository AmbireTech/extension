import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import NoKeysIcon from '@common/assets/svg/NoKeysIcon'
import AccountKeysBottomSheet from '@common/components/AccountKeysBottomSheet'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import AddAccount from '@web/modules/account-select/components/AddAccount'
import { getUiType } from '@web/utils/uiType'

import BottomSheet from '../BottomSheet'

interface Props {
  style?: ViewStyle
  isTransaction?: boolean
  type?: 'long' | 'short'
}

const NoKeysToSignAlert: FC<Props> = ({ style, isTransaction = true, type = 'long' }) => {
  const { account } = useSelectedAccountControllerState()
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
          <View style={{ width: 18, height: 20 }}>
            <NoKeysIcon width={18} height={20} color={theme.secondaryText} />
          </View>
          <Text fontSize={14} appearance="errorText" style={spacings.mhSm}>
            {t(`No keys available to sign this ${isTransaction ? 'transaction' : 'message'}`)}
          </Text>
          <Button
            hasBottomSpacing={false}
            size="small"
            type="error"
            textStyle={{ fontSize: 12 }}
            onPress={() => openBottomSheet()}
            text={t('Check')}
          />
        </View>
      ) : (
        <Alert
          type="error"
          title={t(`No keys available to sign this ${isTransaction ? 'transaction' : 'message'}`)}
          text={t(
            "This account was imported in view-only mode, which means that there isn't an imported key that can sign for this account. \nIf you do have such a key, please re-import the account with it."
          )}
          customIcon={() => <NoKeysIcon color={theme.secondaryText} />}
          buttonProps={{
            onPress: () => openBottomSheet(),
            text: t('Import Key'),
            type: 'error'
          }}
        />
      )}
      <AccountKeysBottomSheet
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        account={account}
        showExportImport
        openAddAccountBottomSheet={openAddAccounts}
      />
      <BottomSheet
        id="no-key-add-account"
        sheetRef={addAccountsRef}
        adjustToContentHeight={!getUiType().isPopup}
        closeBottomSheet={closeBottomSheet}
        scrollViewProps={{ showsVerticalScrollIndicator: false }}
      >
        <AddAccount handleClose={closeAddAccounts as any} />
      </BottomSheet>
    </View>
  )
}

export default React.memo(NoKeysToSignAlert)

import React, { useMemo } from 'react'
import { View } from 'react-native'

import { Account as AccountInterface, ImportStatus } from '@ambire-common/interfaces/account'
import { SafeAccountByOwner } from '@ambire-common/interfaces/safe'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import Account from '@common/modules/account-picker/components/Account'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type Props = {
  account: SafeAccountByOwner
  importedAccount?: AccountInterface
  isSelected: boolean
  withBottomSpacing: boolean
  onSelect: (account: AccountInterface) => void
  onDeselect: (account: AccountInterface) => void
}

const SafeAccountRow = ({
  account,
  importedAccount,
  isSelected,
  withBottomSpacing,
  onSelect,
  onDeselect
}: Props) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const accountToDisplay = useMemo(
    () =>
      importedAccount
        ? {
            ...account,
            preferences: {
              ...account.preferences,
              label: importedAccount.preferences.label
            }
          }
        : account,
    [account, importedAccount]
  )
  const footer = useMemo(
    () => (
      <View style={styles.deployedOnContainer}>
        <Text appearance="secondaryText" fontSize={12}>
          {t('Deployed on:')}
        </Text>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          {account.deployedOn.map((chainId, index) => (
            <NetworkIcon
              key={chainId.toString()}
              id={chainId.toString()}
              style={index === 0 ? { marginLeft: 0 } : { marginLeft: -11 }}
              size={22}
            />
          ))}
        </View>
      </View>
    ),
    [account.deployedOn, styles.deployedOnContainer, t]
  )

  return (
    <Account
      account={accountToDisplay}
      type="smart"
      unused={false}
      withBottomSpacing={withBottomSpacing}
      isSelected={isSelected}
      onSelect={onSelect}
      onDeselect={onDeselect}
      importStatus={
        importedAccount ? ImportStatus.ImportedWithTheSameKeys : ImportStatus.NotImported
      }
      displayTypeBadge={false}
      displayTypePill={false}
      identityDisplayMode="compact"
      selectOnRowPress={false}
      footer={footer}
    />
  )
}

export default React.memo(SafeAccountRow)

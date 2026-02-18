import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'

import { AMBIRE_V1_QUICK_ACC_MANAGER } from '@ambire-common/consts/addresses'
import { Account } from '@ambire-common/interfaces/account'
import { isAmbireV1LinkedAccount } from '@ambire-common/libs/account/account'
import AccountKey, { AccountKeyType } from '@common/components/AccountKey/AccountKey'
import Alert from '@common/components/Alert'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

interface Props {
  account: Account
  openAddAccountBottomSheet?: () => void
  closeBottomSheet: () => void
  keyIconColor?: string
  showExportImport?: boolean
}

const AccountKeys: FC<Props> = ({
  account,
  openAddAccountBottomSheet,
  closeBottomSheet,
  keyIconColor,
  showExportImport
}) => {
  const { t } = useTranslation()

  const { keys } = useController('KeystoreController').state
  const associatedKeys = account?.associatedKeys || []
  const importedAccountKeys = keys.filter(({ addr }) => associatedKeys.includes(addr))
  const notImportedAccountKeys = associatedKeys.filter(
    (keyAddr) =>
      !importedAccountKeys.some(({ addr }) => addr.toLowerCase() === keyAddr.toLowerCase())
  )

  const accountKeys: AccountKeyType[] = [
    ...importedAccountKeys
      .map((key) => ({ isImported: true, ...key }))
      .sort((a, b) => {
        const aCreatedAt = a.meta?.createdAt
        const bCreatedAt = b.meta?.createdAt

        if (aCreatedAt === null && bCreatedAt === null) return 0
        if (aCreatedAt === null) return -1
        if (bCreatedAt === null) return 1

        return aCreatedAt - bCreatedAt
      }),
    ...notImportedAccountKeys.map((keyAddr) => ({
      isImported: false,
      addr: keyAddr,
      label:
        keyAddr === AMBIRE_V1_QUICK_ACC_MANAGER ? 'Email/password signer (Ambire v1)' : undefined,
      dedicatedToOneSA: false
    }))
  ]

  const withAlert = useMemo(
    () => associatedKeys.length > 1 && isAmbireV1LinkedAccount(account.creation?.factoryAddr),
    [account.creation?.factoryAddr, associatedKeys.length]
  )

  return (
    <View style={{ maxHeight: 384, flex: 1 }}>
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
        <PanelBackButton onPress={closeBottomSheet} style={spacings.mrSm} />
        <PanelTitle
          title={t('{{accName}} keys', { accName: account.preferences.label })}
          style={text.left}
        />
      </View>
      <ScrollView
        style={[!!withAlert && spacings.mb, flexbox.flex1]}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {accountKeys.map(({ type, addr, label, isImported, meta, dedicatedToOneSA }, index) => {
          const isLast = index === accountKeys.length - 1
          const accountKeyProps = { label, addr, type, isLast, isImported }

          return (
            <AccountKey
              key={addr + type}
              meta={meta}
              dedicatedToOneSA={dedicatedToOneSA}
              showCopyAddr={!dedicatedToOneSA}
              {...accountKeyProps}
              account={account}
              openAddAccountBottomSheet={openAddAccountBottomSheet}
              keyIconColor={keyIconColor}
              showExportImport={showExportImport}
            />
          )
        })}
      </ScrollView>
      {!!withAlert && (
        <Alert
          withIcon={false}
          title={t('Some keys may no longer be signers of this account')}
          text={t(
            'The listed keys are based on historical data from the blockchain and may no longer be signers of this account.'
          )}
          size="sm"
          type="info"
        />
      )}
    </View>
  )
}

export default React.memo(AccountKeys)

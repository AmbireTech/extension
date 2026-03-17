import React, { FC, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'

import { AMBIRE_V1_QUICK_ACC_MANAGER } from '@ambire-common/consts/addresses'
import { Account } from '@ambire-common/interfaces/account'
import { isAmbireV1LinkedAccount } from '@ambire-common/libs/account/account'
import AccountKey, { AccountKeyType } from '@common/components/AccountKey/AccountKey'
import Alert from '@common/components/Alert'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import { isWeb } from '@common/config/env'
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
  chainId?: bigint
}

const AccountKeys: FC<Props> = ({
  account,
  openAddAccountBottomSheet,
  closeBottomSheet,
  keyIconColor,
  showExportImport,
  chainId
}) => {
  const { t } = useTranslation()
  const { state: accounstState, dispatch: accountsDispatch } = useController('AccountsController')
  const { networks } = useController('NetworksController').state
  const { keys } = useController('KeystoreController').state
  const accountStateCheckedForRef = React.useRef<string | null>(null)

  const accountState = useMemo(() => {
    if (!account) return null

    return accounstState.accountStates[account.addr] || null
  }, [account, accounstState.accountStates])

  const usedNetworks = useMemo(() => {
    return account.safeCreation && chainId
      ? networks.filter((n) => n.chainId === chainId)
      : networks
  }, [chainId, networks, account.safeCreation])

  useEffect(() => {
    const checkedForThisAcc = accountStateCheckedForRef.current === account?.addr
    const networkStates = usedNetworks.filter(
      (n) => !accountState || !accountState[n.chainId.toString()]
    )
    if (checkedForThisAcc && (!account || networkStates.length === 0 || usedNetworks.length === 0))
      return

    accountStateCheckedForRef.current = account.addr

    accountsDispatch({
      type: 'method',
      params: {
        method: 'updateAccountState',
        args: [account.addr, 'latest', networkStates.map((n) => n.chainId)]
      }
    })
  }, [accountState, usedNetworks, account, accountsDispatch])

  /**
   * Get the safe owners by network if the account is a safe
   * We do not display network icons for the others as it doesn't make sense
   */
  const safeOwnersByNetwork: { [address: string]: bigint[] } = useMemo(() => {
    if (!account.safeCreation || !usedNetworks.length || !accountState) return {}

    const associatedKeysByNetwork: { [address: string]: bigint[] } = {}
    usedNetworks.forEach((n) => {
      const networkState = accountState[n.chainId.toString()]
      if (!networkState) return
      networkState.associatedKeys.forEach((key) => {
        if (!associatedKeysByNetwork[key]) associatedKeysByNetwork[key] = []
        associatedKeysByNetwork[key].push(n.chainId)
      })
    })
    return associatedKeysByNetwork
  }, [accountState, usedNetworks, account.safeCreation])

  /**
   * Get all the associatedKeys for this account found accross networks.
   * This is especially important for Safe accounts as they may have
   * different owners across networks
   */
  const associatedKeys: string[] = useMemo(() => {
    if (!usedNetworks.length || !accountState) return []
    return [
      ...new Set(
        usedNetworks
          .map((n) => {
            const networkState = accountState[n.chainId.toString()]
            if (!networkState) return []
            return networkState.associatedKeys
          })
          .flat()
      )
    ]
  }, [accountState, usedNetworks])

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
    <View style={isWeb ? { maxHeight: 384, flex: 1 } : undefined}>
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
        {isWeb && <PanelBackButton onPress={closeBottomSheet} style={spacings.mrSm} />}
        <PanelTitle
          title={t('{{accName}} keys', { accName: account.preferences.label })}
          style={isWeb ? text.left : text.center}
        />
      </View>
      <ScrollView
        bounces={false}
        style={[!!withAlert && spacings.mb, isWeb && flexbox.flex1]}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={isWeb}
      >
        {accountKeys.map(({ type, addr, isImported, meta, dedicatedToOneSA }, index) => {
          const isLast = index === accountKeys.length - 1
          const accountKeyProps = { addr, type, isLast, isImported }

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
              onChains={safeOwnersByNetwork[addr]}
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

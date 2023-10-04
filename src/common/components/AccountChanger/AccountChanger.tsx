import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'

import LogOutIcon from '@common/assets/svg/LogOutIcon'
import Blockies from '@common/components/Blockies'
import Button from '@common/components/Button'
import CopyText from '@common/components/CopyText'
import NavIconWrapper from '@common/components/NavIconWrapper'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import { isWeb } from '@common/config/env'
import useAccounts from '@common/hooks/useAccounts'
import useExtensionWallet from '@common/hooks/useExtensionWallet'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import useVault from '@common/modules/vault/hooks/useVault'
import alert from '@common/services/alert'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import { isExtension } from '@web/constants/browserapi'

import styles from './styles'

const shortenedAddress = (address: any) => `${address.slice(0, 5)}...${address.slice(-3)}`
const walletType = (signerExtra: any) => {
  if (signerExtra && signerExtra.type === 'ledger') return 'Ledger'
  if (signerExtra && signerExtra.type === 'trezor') return 'Trezor'
  return 'Web3'
}

interface Props {
  closeBottomSheet: (dest?: 'alwaysOpen' | 'default' | undefined) => void
}

const AccountChanger: React.FC<Props> = ({ closeBottomSheet }) => {
  const { t } = useTranslation()
  const { accounts, selectedAcc, onSelectAcc, onRemoveAccount } = useAccounts()
  const { removeFromVault } = useVault()
  const { extensionWallet } = useExtensionWallet()
  const { navigate } = useNavigation()

  const handleGoToAddAccount = useCallback(() => {
    closeBottomSheet()

    navigate(isWeb ? ROUTES.getStarted : ROUTES.auth)
  }, [closeBottomSheet, navigate])

  const handleChangeAccount = (accountId: any) => {
    closeBottomSheet()
    onSelectAcc(accountId)
    if (isExtension) {
      extensionWallet!.accountChange(accountId)
    }
  }

  const renderAccount = (account: any) => {
    const isActive = selectedAcc === account.id
    const onChangeAccount = () => handleChangeAccount(account.id)

    const removeAccount = async () => {
      // Remove the external singer encrypted records, if needed.
      const allOtherAccounts = accounts.filter((acc) => acc.id !== account.id)
      const noOtherAccountsHaveTheSameExternalSigner = !allOtherAccounts.some(
        (acc) =>
          (acc?.signer?.address || acc?.signer?.one) ===
          (account?.signer?.address || account?.signer?.one)
      )

      if (noOtherAccountsHaveTheSameExternalSigner) {
        removeFromVault({ addr: account.signer?.address || account.signer?.one }).then(() => {
          onRemoveAccount(account.id)
          closeBottomSheet()
        })
      } else {
        onRemoveAccount(account.id)
        closeBottomSheet()
      }
    }

    const handleRemoveAccount = () => {
      return alert(t('Log out from this account?'), undefined, [
        {
          text: t('Log out'),
          onPress: removeAccount,
          style: 'destructive'
        },
        {
          text: t('Cancel'),
          style: 'cancel'
        }
      ])
    }

    return (
      <TouchableOpacity
        onPress={onChangeAccount}
        key={account?.id}
        style={[styles.accountContainer, isActive && styles.accountContainerActive]}
      >
        <View>
          <Blockies size={8} borderRadius={30} borderColor={colors.valhalla} seed={account?.id} />
        </View>
        <View style={[flexboxStyles.flex1, spacings.mlTy]}>
          <Text type="small" numberOfLines={1} ellipsizeMode="middle">
            {account.id}
          </Text>
          <Text type="info" color={colors.titan_50}>
            {account.email
              ? t('Email/Password account ({{email}})', { email: account?.email })
              : `${walletType(account?.signerExtra)} (${shortenedAddress(
                  account?.signer?.address
                )})`}
          </Text>
        </View>
        <View style={[spacings.ml, { justifyContent: 'flex-start', flexDirection: 'row' }]}>
          <CopyText text={account?.id} />
          <NavIconWrapper onPress={handleRemoveAccount} style={spacings.ml}>
            <LogOutIcon />
          </NavIconWrapper>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <>
      <Title style={textStyles.center} type="small">
        {t('Change Account')}
      </Title>
      {accounts.map(renderAccount)}
      <Button onPress={handleGoToAddAccount} style={spacings.mt} text={t('Add New Account')} />
    </>
  )
}

export default React.memo(AccountChanger)

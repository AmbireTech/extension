import accountPresets from 'ambire-common/src/constants/accountPresets'
import useCacheBreak from 'ambire-common/src/hooks/useCacheBreak'
import { getName } from 'ambire-common/src/services/humanReadableTransactions'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import CONFIG from '@common/config/env'
import useAccounts from '@common/hooks/useAccounts'
import useConstants from '@common/hooks/useConstants'
import useIsScreenFocused from '@common/hooks/useIsScreenFocused'
import useNavigation from '@common/hooks/useNavigation'
import useNetwork from '@common/hooks/useNetwork'
import useRelayerData from '@common/hooks/useRelayerData'
import useToast from '@common/hooks/useToast'
import { MOBILE_ROUTES } from '@common/modules/router/constants/common'
import { triggerLayoutAnimation } from '@common/services/layoutAnimation'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

const SignersList = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const isFocused = useIsScreenFocused()
  const { selectedAcc, account: selectedAccount, onAddAccount } = useAccounts()
  const { constants } = useConstants()
  const { network: selectedNetwork } = useNetwork()
  const { navigate } = useNavigation()
  const { cacheBreak } = useCacheBreak({
    breakPoint: 30000,
    refreshInterval: 40000
  })

  const url = CONFIG.RELAYER_URL
    ? `${CONFIG.RELAYER_URL}/identity/${selectedAcc}/${selectedNetwork?.id}/privileges?cacheBreak=${
        cacheBreak +
        // trick to always trigger a refresh when the screen gets focused
        (isFocused ? 0 : 1)
      }`
    : null
  const { data, errMsg, isLoading } = useRelayerData({ url })

  const privileges = data ? data.privileges : {}
  const showLoading = isLoading && !data

  useEffect(() => {
    triggerLayoutAnimation()
  }, [showLoading, selectedNetwork, selectedAcc])

  const onMakeDefaultBtnClicked = async (account, address, isQuickAccount) => {
    if (isQuickAccount) {
      return addToast(t('To make this signer default, please login with the email') as string, {
        error: true
      })
    }

    onAddAccount({ ...account, signer: { address }, signerExtra: null }, { shouldRedirect: false })
    addToast(
      t(
        'This signer is now the default. If it is a hardware wallet, you will have to re-add the account manually to connect it directly, otherwise you will have to add this signer address to your web3 wallet.'
      ) as string,
      { timeout: 30000 }
    )
  }

  const privList = Object.entries(privileges)
    // Sort the incoming entries, otherwise, they sometime come in different
    // order. And on almost every refresh - the list re-orders. Which is weird.
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([addr, privValue]) => {
      if (!privValue) return null

      const addressName = getName(constants!.humanizerInfo, addr) || null
      const isQuickAcc = addr === accountPresets.quickAccManager
      const privText = isQuickAcc
        ? `Email/password signer (${selectedAccount?.email || 'unknown email'})`
        : `${addr} ${addressName && addressName !== addr ? `(${addressName})` : ''}`
      const signerAddress = isQuickAcc
        ? selectedAccount?.signer?.quickAccManager
        : selectedAccount?.signer?.address
      const isSelected = signerAddress === addr

      const handleOnMakeDefaultBtnClicked = () =>
        onMakeDefaultBtnClicked(selectedAccount, addr, isQuickAcc)

      const handleToggleOtp2Fa = () =>
        navigate(otpEnabled ? MOBILE_ROUTES.disableOtp2FA : MOBILE_ROUTES.enableOtp2FA, {
          state: { selectedSignerAddress: addr }
        })

      const otpEnabled = data ? data.otpEnabled : null

      return (
        <View style={spacings.mb} key={addr}>
          <Text type="small" style={spacings.mbTy}>
            {privText} {isSelected ? <Text type="small">{t('(default signer)')}</Text> : null}
          </Text>
          {!isSelected && (
            <Button
              type="outline"
              size="small"
              onPress={handleOnMakeDefaultBtnClicked}
              text={t('Make default')}
            />
          )}
          {isQuickAcc && data.otpEnabled !== null && (
            <Button
              type={otpEnabled ? 'danger' : 'outline'}
              size="small"
              onPress={handleToggleOtp2Fa}
              text={otpEnabled ? t('Disable 2FA') : t('Enable 2FA')}
            />
          )}
        </View>
      )
    })
    .filter((x) => x)

  return (
    <>
      <Title hasBottomSpacing={false} style={[textStyles.center, spacings.mbSm]}>
        {t('Authorized signers')}
      </Title>
      {showLoading && (
        <View style={[flexboxStyles.center, spacings.pv]}>
          <Spinner />
        </View>
      )}

      {!!errMsg && (
        <Text type="small" appearance="danger" style={spacings.mbSm}>
          {t('Error getting authorized signers: {{errMsg}}', { errMsg })}
        </Text>
      )}
      {privList}
    </>
  )
}

export default SignersList

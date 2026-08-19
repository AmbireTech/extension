import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import AccountKey from '@common/components/AccountKey'
import SafeKeyWrapper from '@common/components/SafeKeyWrapper'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import SigningKeySelect from '@common/modules/sign-message/components/SignKeySelect'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'

import { getSignAndCloseOwnerAddr } from './helpers'

const SafeOwners = ({
  account,
  onSign,
  onSignAndClose,
  isSignLoading,
  signingKeyAddr,
  chainId,
  signed = [],
  importedKeys,
  threshold,
  style
}: {
  account: Account
  onSign?: (signingKeyAddr: Key['addr'], _chosenSigningKeyType: Key['type']) => void
  onSignAndClose?: (signingKeyAddr: Key['addr'], _chosenSigningKeyType: Key['type']) => void
  isSignLoading: boolean
  signingKeyAddr: string | null
  chainId: string
  signed: string[]
  importedKeys: Key[]
  threshold: number
  style?: ViewStyle
}) => {
  const { t } = useTranslation()
  const { theme, themeType } = useTheme()
  const { accountStates } = useController('AccountsController').state
  const [ownerAddrToChooseKeyFor, setOwnerAddrToChooseKeyFor] = useState<Key['addr'] | null>(null)

  const owners = useMemo(() => {
    const state = accountStates[account.addr]?.[chainId]
    if (!state) return []

    return state.associatedKeys
      .map((assKey) => {
        // The same owner address can be imported with more than one key type
        // (e.g. an NFC card and a QR signer), so keep all of them
        const ownerKeys = importedKeys.filter((k) => k.addr === assKey)
        const [firstOwnerKey] = ownerKeys
        if (!firstOwnerKey)
          return {
            addr: assKey,
            type: 'internal' as Key['type'],
            hasSigned: signed.includes(assKey),
            isImported: false,
            keys: ownerKeys
          }

        return {
          ...firstOwnerKey,
          hasSigned: signed.includes(assKey),
          isImported: true,
          keys: ownerKeys
        }
      })
      .sort((a, b) => {
        if (a.isImported && !b.isImported) return -1
        if (!a.isImported && b.isImported) return 1
        return 0
      })
  }, [importedKeys, account.addr, chainId, accountStates, signed])

  const signAndCloseOwnerAddr = useMemo(
    () => getSignAndCloseOwnerAddr(owners, threshold),
    [owners, threshold]
  )

  const ownerToChooseKeyFor = useMemo(
    () => owners.find((o) => o.addr === ownerAddrToChooseKeyFor) || null,
    [owners, ownerAddrToChooseKeyFor]
  )

  const openKeySelect = useCallback((ownerAddr: Key['addr']) => {
    setOwnerAddrToChooseKeyFor(ownerAddr)
  }, [])

  // Owners with more than one imported key type must pick which one signs
  const getOwnerSignHandler = useCallback(
    (owner: { addr: Key['addr']; keys: Key[] }) => {
      if (owner.keys.length > 1) return openKeySelect
      if (signAndCloseOwnerAddr === owner.addr && onSignAndClose) return onSignAndClose

      return onSign
    },
    [openKeySelect, signAndCloseOwnerAddr, onSign, onSignAndClose]
  )

  const handleChooseKey = useCallback(
    (keyAddr: Key['addr'], keyType: Key['type']) => {
      setOwnerAddrToChooseKeyFor(null)

      const sign = signAndCloseOwnerAddr === keyAddr && onSignAndClose ? onSignAndClose : onSign
      sign?.(keyAddr, keyType)
    },
    [signAndCloseOwnerAddr, onSign, onSignAndClose]
  )

  return (
    <View style={[style]}>
      <Text
        fontSize={16}
        weight="semiBold"
        style={{ textAlign: 'center', ...spacings.mb, ...spacings.mtMi }}
      >
        {t(`${threshold} out of ${owners.length} signatures required:`)}
      </Text>
      <ScrollableWrapper
        style={isWeb ? { maxHeight: 120, flexShrink: 0 } : { flex: 0 }}
        contentContainerStyle={{ flexGrow: 0 }}
      >
        {owners.map((o, i) => (
          <SafeKeyWrapper
            key={o.addr}
            isDisabled={!o.isImported}
            hasSigned={o.hasSigned}
            addr={o.addr}
            type={o.type}
            shouldSignAndClose={signAndCloseOwnerAddr === o.addr && !!onSignAndClose}
            style={[i === owners.length - 1 ? spacings.mb0 : spacings.mbTy, { width: '100%' }]}
            onSign={getOwnerSignHandler(o)}
            isSignLoading={isSignLoading && signingKeyAddr === o.addr}
          >
            <AccountKey
              addr={o.addr}
              label={o.addr}
              singleLineLabel={!isWeb}
              type={o.type || 'internal'}
              dedicatedToOneSA={false}
              isImported
              account={account}
              isLast
              keyIconColor={theme.neutral600 as string}
              tooltipContent={o.hasSigned ? 'Signed' : o.isImported ? 'Pending' : 'Not imported'}
              itemHeight={38}
              containerStyle={{
                borderWidth: 1,
                borderColor: 'transparent',
                backgroundColor: themeType === THEME_TYPES.LIGHT ? '#fff' : '#000'
              }}
            />
          </SafeKeyWrapper>
        ))}
      </ScrollableWrapper>
      {!!ownerToChooseKeyFor && (
        <SigningKeySelect
          type="signing"
          isVisible
          isSigning={isSignLoading}
          handleClose={() => setOwnerAddrToChooseKeyFor(null)}
          selectedAccountKeyStoreKeys={ownerToChooseKeyFor.keys}
          handleChooseKey={handleChooseKey}
          account={account}
        />
      )}
    </View>
  )
}

export default SafeOwners

import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import CopyIcon from '@common/assets/svg/CopyIcon'
import AccountKeyIcon from '@common/components/AccountKeyIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HumanizerAddress from '@common/components/HumanizerAddress'
import SafeKeyWrapper from '@common/components/SafeKeyWrapper'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import SigningKeySelect from '@common/modules/sign-message/components/SignKeySelect'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'

import { getSignAndCloseOwnerAddr } from './helpers'

const SafeOwnerAddress = React.memo(function SafeOwnerAddress({
  address,
  chainId,
  isDisabled,
  type
}: {
  address: string
  chainId: bigint
  isDisabled: boolean
  type: Key['type']
}) {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const [bindCopyIconAnim, copyIconAnimStyle] = useHover({
    preset: 'opacityInverted'
  })

  const handleCopy = useCallback(async () => {
    try {
      await setStringAsync(address)
      addToast(t('Address copied to clipboard'))
    } catch {
      addToast(t('Failed to copy address'), { type: 'error' })
    }
  }, [addToast, address, t])

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.phSm,
        spacings.pvTy,
        {
          width: '100%',
          minWidth: 0,
          minHeight: 38,
          borderRadius: BORDER_RADIUS_PRIMARY,
          backgroundColor: theme.primaryBackground
        }
      ]}
    >
      <View style={spacings.mrTy}>
        <AccountKeyIcon iconSize={20} type={type} color={theme.neutral600} />
      </View>
      <View
        style={[flexbox.flex1, { minWidth: 0 }]}
        dataSet={
          isDisabled
            ? createGlobalTooltipDataSet({
                id: `safe-owner-${address}-not-imported-tooltip`,
                content: t('Not imported')
              })
            : undefined
        }
      >
        <HumanizerAddress
          address={address}
          chainId={chainId}
          fontSize={15}
          hideActions
          actionsMode="inline"
          shouldWrapInlineActions={false}
        />
      </View>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={t('Copy address')}
        onPress={handleCopy}
        style={[
          copyIconAnimStyle,
          spacings.mlMi,
          { flexShrink: 0 },
          isWeb && { cursor: 'pointer' }
        ]}
        {...bindCopyIconAnim}
      >
        <CopyIcon width={17} height={17} color={theme.secondaryText} />
      </AnimatedPressable>
    </View>
  )
})

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
  const { state: accountStates } = useController('AccountsController', 'accountStates')
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
    <View style={[style, isWeb ? ({ cursor: 'default' } as any) : undefined]}>
      <Text
        fontSize={16}
        weight="semiBold"
        style={{ textAlign: 'center', ...spacings.mb, ...spacings.mtMi }}
      >
        {t(`${threshold} out of ${owners.length} signatures required:`)}
      </Text>
      <ScrollableWrapper
        // Web (incl. side panel) needs maxHeight so the list keeps intrinsic height;
        // `{ flex: 0 }` alone collapses the rows on RN web.
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
            <SafeOwnerAddress
              address={o.addr}
              chainId={BigInt(chainId)}
              isDisabled={!o.isImported}
              type={o.type}
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

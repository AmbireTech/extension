import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import CopyIcon from '@common/assets/svg/CopyIcon'
import WalletIcon from '@common/assets/svg/WalletIcon'
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
import spacings, { SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'

import { getSignAndCloseOwnerAddr } from './helpers'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** Up to this many owners are shown in full; any more and the list becomes scrollable */
const MAX_OWNERS_WITHOUT_SCROLL = 5
const OWNER_ROW_HEIGHT = 40
const OWNERS_LIST_MAX_HEIGHT =
  MAX_OWNERS_WITHOUT_SCROLL * (OWNER_ROW_HEIGHT + SPACING_TY) - SPACING_TY

const SafeOwnerAddress = React.memo(function SafeOwnerAddress({
  address,
  chainId,
  tooltipText,
  type
}: {
  address: string
  chainId: bigint
  tooltipText: string | null
  /** `smart` for owners that are smart accounts, `safe` for Safe accounts among them */
  type: Key['type'] | 'smart' | 'safe'
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
          height: OWNER_ROW_HEIGHT,
          borderRadius: BORDER_RADIUS_PRIMARY,
          backgroundColor: theme.primaryBackground
        }
      ]}
    >
      <View style={spacings.mrTy}>
        {type === 'smart' ? (
          <WalletIcon width={20} height={20} color={theme.neutral600} />
        ) : (
          <AccountKeyIcon iconSize={20} type={type} color={theme.neutral600} />
        )}
      </View>
      <View
        style={[flexbox.flex1, { minWidth: 0 }]}
        dataSet={
          tooltipText
            ? createGlobalTooltipDataSet({
                id: `safe-owner-${address}-tooltip`,
                content: tooltipText
              })
            : undefined
        }
      >
        <HumanizerAddress
          address={address}
          chainId={chainId}
          fontSize={15}
          numberOfLines={1}
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

const selectAccountStates = (state: AllControllersMappingType['AccountsController']) =>
  state.accountStates
const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts

const SafeOwners = ({
  account,
  onSign,
  onSignAndClose,
  isSignLoading,
  signingKeyAddr,
  chainId,
  signed = [],
  importedKeys,
  smartAccountOwners = [],
  pendingApprovalOwners = [],
  approvingOwnerAddr = null,
  onApprove,
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
  /**
   * Owners that are smart accounts imported in the wallet. They approve onchain with a
   * transaction of their own (onApprove). Pass them only where that's supported.
   * Ignored without onApprove, so these owners show as not imported
   */
  smartAccountOwners?: string[]
  /** Smart account owners whose approval was sent but isn't confirmed yet */
  pendingApprovalOwners?: string[]
  /** The smart account owner whose approval the user is going through */
  approvingOwnerAddr?: string | null
  onApprove?: (ownerAddr: string) => void
  threshold: number
  style?: ViewStyle
}) => {
  const { t } = useTranslation()
  const { state: accountStates } = useController('AccountsController', selectAccountStates)
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const [ownerAddrToChooseKeyFor, setOwnerAddrToChooseKeyFor] = useState<Key['addr'] | null>(null)

  const owners = useMemo(() => {
    const state = accountStates[account.addr]?.[chainId]
    if (!state) return []

    return state.associatedKeys
      .map((assKey) => {
        // A smart account owner approves with a transaction of its own instead of a key
        if (onApprove && smartAccountOwners.includes(assKey)) {
          const isSafeOwner = !!accounts.find((a) => a.addr === assKey)?.safeCreation
          return {
            addr: assKey,
            type: (isSafeOwner ? 'safe' : 'smart') as Key['type'] | 'smart' | 'safe',
            hasSigned: signed.includes(assKey),
            isImported: true,
            isSmartAccount: true,
            isApprovalPending: pendingApprovalOwners.includes(assKey),
            tooltipText: t('Approves with a transaction from this account, which costs a fee'),
            keys: [] as Key[]
          }
        }

        // The same owner address can be imported with more than one key type
        // (e.g. an NFC card and a QR signer), so keep all of them
        const ownerKeys = importedKeys.filter((k) => k.addr === assKey)
        const [firstOwnerKey] = ownerKeys
        if (!firstOwnerKey)
          return {
            addr: assKey,
            type: 'internal' as Key['type'] | 'smart' | 'safe',
            hasSigned: signed.includes(assKey),
            isImported: false,
            isSmartAccount: false,
            isApprovalPending: false,
            tooltipText: t('Not imported'),
            keys: ownerKeys
          }

        return {
          addr: assKey,
          type: firstOwnerKey.type as Key['type'] | 'smart' | 'safe',
          hasSigned: signed.includes(assKey),
          isImported: true,
          isSmartAccount: false,
          isApprovalPending: false,
          tooltipText: null,
          keys: ownerKeys
        }
      })
      .sort((a, b) => {
        if (a.isImported && !b.isImported) return -1
        if (!a.isImported && b.isImported) return 1
        return 0
      })
  }, [
    importedKeys,
    account.addr,
    chainId,
    accountStates,
    signed,
    accounts,
    smartAccountOwners,
    pendingApprovalOwners,
    onApprove,
    t
  ])

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
    (owner: { addr: Key['addr']; keys: Key[]; isSmartAccount: boolean }) => {
      if (owner.isSmartAccount) return onApprove
      if (owner.keys.length > 1) return openKeySelect
      if (signAndCloseOwnerAddr === owner.addr && onSignAndClose) return onSignAndClose

      return onSign
    },
    [openKeySelect, signAndCloseOwnerAddr, onSign, onSignAndClose, onApprove]
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
        // Web (incl. side panel) needs flexShrink: 0 so the list keeps intrinsic height;
        // `{ flex: 0 }` alone collapses the rows on RN web.
        style={[
          isWeb ? { flexShrink: 0 } : { flex: 0 },
          owners.length > MAX_OWNERS_WITHOUT_SCROLL && { maxHeight: OWNERS_LIST_MAX_HEIGHT }
        ]}
        contentContainerStyle={{ flexGrow: 0 }}
      >
        {owners.map((o, i) => (
          <SafeKeyWrapper
            key={o.addr}
            isDisabled={!o.isImported}
            hasSigned={o.hasSigned}
            addr={o.addr}
            type={o.keys[0]?.type ?? 'internal'}
            shouldSignAndClose={signAndCloseOwnerAddr === o.addr && !!onSignAndClose}
            style={[i === owners.length - 1 ? spacings.mb0 : spacings.mbTy, { width: '100%' }]}
            onSign={getOwnerSignHandler(o)}
            isSignLoading={
              o.isSmartAccount
                ? // until the user goes back, or the sent approval is confirmed or fails
                  approvingOwnerAddr === o.addr || o.isApprovalPending
                : isSignLoading && signingKeyAddr === o.addr
            }
            signButtonText={o.isSmartAccount ? t('Approve') : undefined}
          >
            <SafeOwnerAddress
              address={o.addr}
              chainId={BigInt(chainId)}
              tooltipText={o.tooltipText}
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

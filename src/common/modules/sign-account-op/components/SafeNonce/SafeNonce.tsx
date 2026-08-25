import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View, ViewStyle } from 'react-native'

import { getAccountOpNonce } from '@ambire-common/libs/accountOp/accountOp'
import NetworkIcon from '@common/components/NetworkIcon'
import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import { isValidSafeNonce } from './helpers'

const getNonce = (safeTxNonce: string | undefined, accountOpNonce: bigint | null) =>
  safeTxNonce === undefined ? (accountOpNonce ?? 0n) : BigInt(safeTxNonce)

interface Props {
  withNetwork?: boolean
}

const SafeNonce = ({ withNetwork = false }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { state: signAccountOpState, dispatch } = useController('SignAccountOpController')
  const { accountStates } = useController('AccountsController').state
  const { networks } = useController('NetworksController').state
  const { userRequests } = useController('RequestsController').state
  const fromRequestId = signAccountOpState?.fromRequestId

  // Nonces already used by every OTHER queued Safe request for this account/chain. Computed
  // straight from already-loaded UI state (userRequests), independent of the current request's
  // own committed nonce - which lags a dispatch -> background -> emitUpdate round trip.
  const queuedSafeNonces = useMemo(() => {
    if (!signAccountOpState) return []

    const { accountOp } = signAccountOpState

    return userRequests.reduce<bigint[]>((nonces, request) => {
      if (
        request.kind !== 'calls' ||
        request.id === fromRequestId ||
        !request.signAccountOp.account.safeCreation ||
        request.signAccountOp.accountOp.accountAddr !== accountOp.accountAddr ||
        request.signAccountOp.accountOp.chainId !== accountOp.chainId
      )
        return nonces

      const requestNonce = getAccountOpNonce(request.signAccountOp.accountOp)
      if (requestNonce !== null) nonces.push(requestNonce)
      return nonces
    }, [])
  }, [fromRequestId, signAccountOpState, userRequests])

  const nonce = useMemo(
    () =>
      getNonce(
        signAccountOpState?.accountOp.safeTx?.nonce,
        signAccountOpState?.accountOp.nonce || null
      ),
    [signAccountOpState?.accountOp.nonce, signAccountOpState?.accountOp.safeTx?.nonce]
  )
  const latestNonce = useMemo(() => {
    if (!signAccountOpState) return undefined

    return accountStates[signAccountOpState.accountOp.accountAddr]?.[
      signAccountOpState.accountOp.chainId.toString()
    ]?.nonce
  }, [accountStates, signAccountOpState])
  const network = useMemo(
    () => networks.find(({ chainId }) => chainId === signAccountOpState?.accountOp.chainId),
    [networks, signAccountOpState?.accountOp.chainId]
  )
  const nonceString = nonce.toString()
  const [draftNonceState, setDraftNonceState] = useState({
    fromRequestId,
    sourceNonce: nonceString,
    value: nonceString
  })
  const isDraftForCurrentNonce =
    draftNonceState.fromRequestId === fromRequestId && draftNonceState.sourceNonce === nonceString
  const draftNonce = isDraftForCurrentNonce ? draftNonceState.value : nonceString
  const canEdit =
    !signAccountOpState?.isSignInProgress &&
    !signAccountOpState?.accountOp.signed?.length &&
    !signAccountOpState?.accountOp.safeTx?.confirmations?.length
  const hasNetworkLayout = isMobile || withNetwork
  const isDraftValid = isValidSafeNonce(draftNonce, latestNonce)
  const isDraftBelowLatestNonce =
    latestNonce !== undefined && isValidSafeNonce(draftNonce) && BigInt(draftNonce) < latestNonce

  const validationMessage = useMemo(() => {
    if (isDraftBelowLatestNonce) {
      return t('The nonce must be at least {{nonce}}.', { nonce: latestNonce?.toString() })
    }

    if (!isDraftValid) return t('Enter a valid whole number.')

    return ''
  }, [isDraftBelowLatestNonce, isDraftValid, latestNonce, t])

  const handleNonceChange = useCallback(
    (value: string) => {
      setDraftNonceState({ fromRequestId, sourceNonce: nonceString, value })
      if (!isValidSafeNonce(value, latestNonce)) return

      dispatch({
        type: 'method',
        params: {
          method: 'setSafeNonce',
          args: [BigInt(value)]
        }
      })
    },
    [dispatch, fromRequestId, latestNonce, nonceString]
  )

  // The message bubble only pops up while the nonce input is focused, like a tooltip.
  // Closing is driven by an outside click rather than the input's onBlur, so pressing the
  // bubble's own action (which would otherwise blur the input first) doesn't race it shut -
  // same pattern used by the Recipient/Select dropdowns (see useSelect.ts).
  const [isNonceInputFocused, setIsNonceInputFocused] = useState(false)
  const containerRef = useRef<View>(null)
  const handleNonceInputFocus = useCallback(() => setIsNonceInputFocused(true), [])

  useEffect(() => {
    if (!isWeb || !isNonceInputFocused) return undefined

    const handleClickOutside = (event: MouseEvent) => {
      const node = containerRef.current as unknown as HTMLElement | null
      if (node && !node.contains(event.target as Node)) setIsNonceInputFocused(false)
    }

    document.addEventListener('mousedown', handleClickOutside, { passive: true })
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isNonceInputFocused])

  // Compares the raw keystroke (draftNonce) against the already-loaded nonces above, so the
  // bubble reacts the instant the value becomes a conflict - the same way the "too low"
  // validationMessage above reacts instantly against the already-loaded latestNonce.
  const nonceConflict = useMemo(() => {
    if (!isDraftValid || signAccountOpState?.accountOp.meta?.isOnchainSafeRejection) return null

    const draftNonceBig = BigInt(draftNonce)
    if (!queuedSafeNonces.includes(draftNonceBig)) return null

    const highestQueuedNonce = queuedSafeNonces.reduce(
      (highestNonce, queuedNonce) => (queuedNonce > highestNonce ? queuedNonce : highestNonce),
      draftNonceBig
    )

    return { nextNonce: highestQueuedNonce + 1n }
  }, [
    draftNonce,
    isDraftValid,
    queuedSafeNonces,
    signAccountOpState?.accountOp.meta?.isOnchainSafeRejection
  ])

  const handleUseNextAvailableNonce = useCallback(() => {
    if (!nonceConflict) return

    // Unfocusing hides the bubble immediately, without waiting on the
    // dispatch -> background -> emitUpdate round trip to clear the conflict.
    setIsNonceInputFocused(false)
    setDraftNonceState({
      fromRequestId,
      sourceNonce: nonceString,
      value: nonceConflict.nextNonce.toString()
    })
    dispatch({
      type: 'method',
      params: {
        method: 'setSafeNonce',
        args: [nonceConflict.nextNonce]
      }
    })
  }, [dispatch, fromRequestId, nonceConflict, nonceString])

  // Small floating card styled like the app's real Tooltip (Tooltip.web.tsx), so the
  // conflict reads as an Ambire tooltip popup rather than a one-off alert card. The
  // "too low" validation error is shown separately, as plain text under the input.
  const nonceConflictBubble = useMemo(() => {
    if (!canEdit || !isNonceInputFocused || !nonceConflict) return null

    return (
      <Pressable onPress={handleUseNextAvailableNonce}>
        <View style={{ position: 'relative' }}>
          {/* Small diamond acting as the tooltip's pointer arrow. On mobile the bubble renders
          below the input instead of above it (there's no scroll room above, since SafeNonce
          sits at the top of the screen), so the arrow points up at it instead of down. */}
          <View
            style={[
              {
                position: 'absolute',
                right: 24,
                width: 10,
                height: 10,
                backgroundColor: theme.tertiaryBackground,
                borderColor: theme.secondaryBorder,
                transform: [{ rotate: '45deg' }]
              },
              isMobile
                ? { top: -5, borderTopWidth: 1, borderLeftWidth: 1 }
                : { bottom: -5, borderBottomWidth: 1, borderRightWidth: 1 }
            ]}
          />
          <View
            style={[
              spacings.phSm,
              spacings.pvTy,
              {
                width: 280,
                borderRadius: BORDER_RADIUS_PRIMARY,
                borderWidth: 1,
                borderColor: theme.secondaryBorder,
                backgroundColor: theme.tertiaryBackground,
                shadowColor: theme.shadowPrimary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 8,
                elevation: 8
              }
            ]}
          >
            <Text fontSize={14} appearance="secondaryText">
              {t('A pending transaction already uses this nonce. ')}
              <Text fontSize={14} appearance="linkText" underline>
                {t('You can use nonce {{nextNonce}}', {
                  nextNonce: nonceConflict.nextNonce.toString()
                })}
              </Text>
            </Text>
          </View>
        </View>
      </Pressable>
    )
  }, [canEdit, handleUseNextAvailableNonce, isNonceInputFocused, nonceConflict, t, theme])

  const nonceInput = useMemo(
    () => (
      <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyEnd, flexbox.flex1]}>
        <NumberInput
          value={canEdit ? draftNonce : nonce.toString()}
          onChangeText={handleNonceChange}
          onFocus={handleNonceInputFocus}
          precision={0}
          disabled={!canEdit}
          containerStyle={[
            spacings.mb0 as ViewStyle,
            hasNetworkLayout ? flexbox.flex1 : { width: 80 }
          ]}
          inputWrapperStyle={{
            height: hasNetworkLayout ? 30 : 32,
            borderRadius: 50,
            ...(canEdit && !!validationMessage ? { borderColor: theme.errorDecorative } : {})
          }}
          inputStyle={[spacings.phTy as ViewStyle, { height: 30 }]}
          nativeInputStyle={{
            color: theme.primaryText,
            fontSize: hasNetworkLayout ? 16 : 14,
            textAlign: 'center'
          }}
          backgroundColor={theme.tertiaryBackground}
        />
      </View>
    ),
    [
      canEdit,
      draftNonce,
      handleNonceChange,
      handleNonceInputFocus,
      hasNetworkLayout,
      nonce,
      theme,
      validationMessage
    ]
  )

  if (!signAccountOpState?.account.safeCreation) return null

  return !hasNetworkLayout ? (
    <View ref={containerRef} style={{ width: 165, height: 40 }}>
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.phSm,
          {
            height: 40,
            borderRadius: 50,
            borderWidth: 1,
            borderColor: theme.primaryBorder
          }
        ]}
      >
        <Text fontSize={14} appearance="secondaryText">
          {t('Nonce')}
        </Text>
        <View style={[flexbox.flex1, spacings.mlTy]}>{nonceInput}</View>
      </View>
      {canEdit && !!validationMessage && (
        <Text
          fontSize={10}
          appearance="errorText"
          numberOfLines={1}
          style={{ position: 'absolute', top: 42, right: 0, textAlign: 'right' }}
        >
          {validationMessage}
        </Text>
      )}
      {!!nonceConflictBubble && (
        <View
          style={{ position: 'absolute', bottom: '100%', right: -40, marginBottom: 8, zIndex: 10 }}
        >
          {nonceConflictBubble}
        </View>
      )}
    </View>
  ) : (
    <View
      ref={containerRef}
      style={[
        flexbox.directionRow,
        flexbox.alignStart,
        spacings.pvTy,
        spacings.phSm,
        spacings.mbSm,
        {
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.primaryBorder
        }
      ]}
    >
      <View style={flexbox.flex1}>
        <Text fontSize={12} appearance="secondaryText">
          {t('Network')}
        </Text>
        {/* Same height as the nonce input so both values are centered with one another */}
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtMi, { height: 32 }]}>
          <NetworkIcon id={signAccountOpState.accountOp.chainId.toString()} size={20} scale={1} />
          <Text
            fontSize={16}
            weight="medium"
            numberOfLines={1}
            style={[spacings.mlTy, { flexShrink: 1 }]}
          >
            {network?.name || t('Unknown network')}
          </Text>
        </View>
      </View>
      {/* Negative vertical margin cancels the card padding so the line spans edge to edge */}
      <View
        style={{
          width: 1,
          alignSelf: 'stretch',
          marginVertical: -SPACING_TY,
          backgroundColor: theme.primaryBorder
        }}
      />
      <View style={[flexbox.flex1, spacings.plSm, { position: 'relative' }]}>
        <Text fontSize={12} appearance="secondaryText">
          {t('Nonce')}
        </Text>
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtMi, { width: '100%' }]}>
          {nonceInput}
        </View>
        {canEdit && !!validationMessage && (
          <Text
            fontSize={10}
            appearance="errorText"
            numberOfLines={1}
            style={{
              position: 'absolute',
              top: 48 + SPACING_MI,
              right: 0,
              width: 200,
              textAlign: 'right'
            }}
          >
            {validationMessage}
          </Text>
        )}
        {!!nonceConflictBubble && (
          <View
            style={[
              { position: 'absolute', right: -40, zIndex: 10 },
              // On mobile the bubble renders below the input instead of above it, because
              // this component sits at the top of the screen's ScrollView, leaving no
              // scroll room above it for an upward-opening bubble to be visible in.
              isMobile ? { top: '100%', marginTop: 8 } : { bottom: '100%', marginBottom: 8 }
            ]}
          >
            {nonceConflictBubble}
          </View>
        )}
      </View>
    </View>
  )
}

export default React.memo(SafeNonce)

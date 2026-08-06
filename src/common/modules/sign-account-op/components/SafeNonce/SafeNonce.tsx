import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import NetworkIcon from '@common/components/NetworkIcon'
import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { isValidSafeNonce } from './helpers'

const getNonce = (safeTxNonce: string | undefined, accountOpNonce: bigint | null) =>
  safeTxNonce === undefined ? (accountOpNonce ?? 0n) : BigInt(safeTxNonce)

const SafeNonce = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { state: signAccountOpState, dispatch } = useController('SignAccountOpController')
  const { accountStates } = useController('AccountsController').state
  const { networks } = useController('NetworksController').state
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
  const fromRequestId = signAccountOpState?.fromRequestId
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

  const nonceInput = useMemo(
    () => (
      <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyEnd, flexbox.flex1]}>
        <NumberInput
          value={canEdit ? draftNonce : nonce.toString()}
          onChangeText={handleNonceChange}
          precision={0}
          disabled={!canEdit}
          containerStyle={[spacings.mb0 as ViewStyle, isWeb ? { width: 80 } : flexbox.flex1]}
          inputWrapperStyle={{
            height: isMobile ? 30 : 32,
            borderRadius: 8,
            ...(canEdit && !!validationMessage ? { borderColor: theme.errorDecorative } : {})
          }}
          inputStyle={[spacings.phTy as ViewStyle, { height: 30 }]}
          nativeInputStyle={{
            color: theme.primaryText,
            fontSize: isWeb ? 14 : 16,
            textAlign: 'center'
          }}
          backgroundColor={theme.tertiaryBackground}
        />
      </View>
    ),
    [canEdit, draftNonce, handleNonceChange, nonce, theme, validationMessage]
  )

  if (!signAccountOpState?.account.safeCreation) return null

  return isWeb ? (
    <View style={{ width: 165, height: 40 }}>
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
    </View>
  ) : (
    <View
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
      </View>
    </View>
  )
}

export default React.memo(SafeNonce)

import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, View, ViewStyle } from 'react-native'

import CheckIcon2 from '@common/assets/svg/CheckIcon2'
import EditPenIcon from '@common/assets/svg/EditPenIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import NetworkIcon from '@common/components/NetworkIcon'
import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
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
  const [draftNonce, setDraftNonce] = useState(nonce.toString())
  const [isEditing, setIsEditing] = useState(false)
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

  const handleEdit = useCallback(() => {
    setDraftNonce(nonce.toString())
    setIsEditing(true)
  }, [nonce])

  const handleSave = useCallback(() => {
    if (!isValidSafeNonce(draftNonce, latestNonce)) return

    dispatch({
      type: 'method',
      params: {
        method: 'setSafeNonce',
        args: [BigInt(draftNonce)]
      }
    })
    setIsEditing(false)
  }, [dispatch, draftNonce, latestNonce])

  const handleButtonPress = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation()

      if (isEditing) {
        handleSave()
        return
      }

      handleEdit()
    },
    [handleEdit, handleSave, isEditing]
  )

  const nonceInputAndButton = useMemo(
    () => (
      <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyEnd, flexbox.flex1]}>
        <NumberInput
          key={isEditing ? 'enabled' : 'disabled'}
          value={isEditing ? draftNonce : nonce.toString()}
          onChangeText={setDraftNonce}
          precision={0}
          autoFocus={isEditing}
          disabled={!isEditing}
          returnKeyType="done"
          blurOnSubmit={false}
          onSubmitEditing={handleSave}
          containerStyle={[spacings.mb0 as ViewStyle, isWeb ? { width: 80 } : flexbox.flex1]}
          inputWrapperStyle={{
            height: 32,
            borderRadius: 8,
            ...(isEditing && !!validationMessage ? { borderColor: theme.errorDecorative } : {})
          }}
          inputStyle={[spacings.phTy as ViewStyle, { height: 30 }]}
          nativeInputStyle={{
            color: theme.primaryText,
            fontSize: isWeb ? 14 : 16,
            textAlign: 'center'
          }}
          backgroundColor={theme.tertiaryBackground}
        />
        <HoverablePressable
          onPress={handleButtonPress}
          disabled={!canEdit || (isEditing && !isDraftValid)}
          accessibilityRole="button"
          accessibilityLabel={isEditing ? t('Save') : t('Edit')}
          style={[
            flexbox.center,
            spacings.mlTy,
            {
              width: 28,
              height: 28,
              opacity: !canEdit || (isEditing && !isDraftValid) ? 0.4 : 1
            }
          ]}
        >
          {isEditing ? (
            <CheckIcon2 width={18} height={18} />
          ) : (
            <EditPenIcon width={18} height={18} color={theme.linkText} />
          )}
        </HoverablePressable>
      </View>
    ),
    [
      canEdit,
      draftNonce,
      handleButtonPress,
      handleSave,
      isDraftValid,
      isEditing,
      nonce,
      t,
      theme,
      validationMessage
    ]
  )

  if (!signAccountOpState?.account.safeCreation) return null

  return isWeb ? (
    <View style={{ width: 205, height: 40 }}>
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
        <View style={[flexbox.flex1, spacings.mlTy]}>{nonceInputAndButton}</View>
      </View>
      {isEditing && !!validationMessage && (
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
        flexbox.alignCenter,
        spacings.ph,
        spacings.pvSm,
        spacings.mbSm,
        {
          minHeight: 72,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.primaryBorder
        }
      ]}
    >
      <View style={{ flex: 1.4 }}>
        <Text fontSize={12} appearance="secondaryText">
          {t('Network')}
        </Text>
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtMi]}>
          <NetworkIcon id={signAccountOpState.accountOp.chainId.toString()} size={20} />
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
      <View
        style={{
          width: 1,
          height: 48,
          backgroundColor: theme.primaryBorder
        }}
      />
      <View style={[flexbox.flex1, spacings.pl, { position: 'relative' }]}>
        <Text fontSize={12} appearance="secondaryText">
          {t('Nonce')}
        </Text>
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtMi, { width: '100%' }]}>
          {nonceInputAndButton}
        </View>
        {isEditing && !!validationMessage && (
          <Text
            fontSize={10}
            appearance="errorText"
            numberOfLines={1}
            style={{ position: 'absolute', top: 48, right: 0, width: 200, textAlign: 'right' }}
          >
            {validationMessage}
          </Text>
        )}
      </View>
    </View>
  )
}

export default React.memo(SafeNonce)

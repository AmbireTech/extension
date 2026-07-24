import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import EditButton from '@common/components/EditButton'
import FooterGlassView from '@common/components/FooterGlassView'
import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
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
  const { ref: sheetRef, open, close } = useModalize()
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
  const [draftNonce, setDraftNonce] = useState(nonce.toString())
  const canEdit =
    !signAccountOpState?.isSignInProgress &&
    !signAccountOpState?.accountOp.signed?.length &&
    !signAccountOpState?.accountOp.safeTx?.confirmations?.length
  const isDraftValid = isValidSafeNonce(draftNonce, latestNonce)
  const isDraftBelowLatestNonce =
    latestNonce !== undefined && isValidSafeNonce(draftNonce) && BigInt(draftNonce) < latestNonce

  const handleOpen = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation()
      setDraftNonce(nonce.toString())
      open()
    },
    [nonce, open]
  )

  const handleSave = useCallback(() => {
    if (!isValidSafeNonce(draftNonce, latestNonce)) return

    dispatch({
      type: 'method',
      params: {
        method: 'setSafeNonce',
        args: [BigInt(draftNonce)]
      }
    })
    close()
  }, [close, dispatch, draftNonce, latestNonce])

  if (!signAccountOpState?.account.safeCreation) return null

  return (
    <>
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.mb
        ]}
      >
        <Text fontSize={14} appearance="secondaryText">
          {t('Nonce')}
        </Text>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Text fontSize={14} weight="medium" style={canEdit ? spacings.mrTy : undefined}>
            {nonce.toString()}
          </Text>
          {canEdit && <EditButton onPress={handleOpen} />}
        </View>
      </View>
      <BottomSheet
        sheetRef={sheetRef}
        id="edit-safe-nonce-bottom-sheet"
        type="modal"
        closeBottomSheet={close}
        style={{ maxWidth: 460 }}
        shouldBeClosableOnDrag={false}
        animationDuration={0}
      >
        <View style={flexbox.alignCenter}>
          <Text fontSize={20} weight="medium" style={[spacings.mbXl, spacings.mtTy]}>
            {t('Edit nonce')}
          </Text>
          <View style={{ width: '100%' }}>
            <NumberInput
              value={draftNonce}
              onChangeText={setDraftNonce}
              precision={0}
              autoFocus
              preventJumpOnValidationChange
              backgroundColor={theme.tertiaryBackground}
              error={
                isDraftBelowLatestNonce
                  ? t('The nonce must be at least {{nonce}}.', { nonce: latestNonce.toString() })
                  : draftNonce && !isDraftValid
                    ? t('Enter a valid whole number.')
                    : false
              }
            />
          </View>
          <FooterGlassView
            absolute={false}
            style={{ ...spacings.mt2Xl }}
            mobileStyle={{ ...flexbox.directionRow, ...spacings.mtLg }}
          >
            <Button
              type="secondary"
              text={t('Cancel')}
              onPress={() => close()}
              hasBottomSpacing={false}
              size="smaller"
              style={[spacings.mrTy, isWeb && { width: 100 }, isMobile && flexbox.flex1]}
            />
            <Button
              type="primary"
              text={t('Save')}
              onPress={handleSave}
              disabled={!isDraftValid}
              hasBottomSpacing={false}
              size="smaller"
              style={[isWeb && { width: 100 }, isMobile && flexbox.flex1]}
            />
          </FooterGlassView>
        </View>
      </BottomSheet>
    </>
  )
}

export default React.memo(SafeNonce)

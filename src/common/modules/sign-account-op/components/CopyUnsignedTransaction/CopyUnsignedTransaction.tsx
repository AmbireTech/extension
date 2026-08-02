import React, { FC, memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import CopyIcon from '@common/assets/svg/CopyIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import TextArea from '@common/components/TextArea'
import { GEIST_MONO_FONT_FAMILIES } from '@common/hooks/useFonts'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'

const GENERATION_TIMEOUT_MS = 15000

interface Props {
  signAccountOpState: ISignAccountOpController | null
  onGenerate: () => void
}

const CopyUnsignedTransaction: FC<Props> = ({ signAccountOpState, onGenerate }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const [hasGenerationTimedOut, setHasGenerationTimedOut] = useState(false)
  const generationRequestedRef = useRef(false)
  const generationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onGenerateRef = useRef(onGenerate)

  const unsignedTransaction = signAccountOpState?.unsignedTransaction ?? null
  const gasFeePayment = signAccountOpState?.accountOp?.gasFeePayment ?? null

  const isViewOnlyEOA =
    !!signAccountOpState &&
    !signAccountOpState.account.safeCreation &&
    !signAccountOpState.account.creation &&
    (signAccountOpState.accountKeyStoreKeys?.length || 0) === 0

  useEffect(() => {
    onGenerateRef.current = onGenerate
  })

  useEffect(() => {
    return () => {
      if (generationTimeoutRef.current) clearTimeout(generationTimeoutRef.current)
    }
  }, [])

  // Generate the unsigned transaction automatically once the fee estimation for
  // the view-only EOA account completes (the raw tx cannot be built without it).
  const canGenerate = isViewOnlyEOA && !!gasFeePayment
  useEffect(() => {
    if (!canGenerate || generationRequestedRef.current || !!unsignedTransaction) return

    generationRequestedRef.current = true
    onGenerateRef.current()

    if (generationTimeoutRef.current) clearTimeout(generationTimeoutRef.current)
    generationTimeoutRef.current = setTimeout(
      () => setHasGenerationTimedOut(true),
      GENERATION_TIMEOUT_MS
    )
  }, [canGenerate, unsignedTransaction])

  const handleRetry = useCallback(() => {
    generationRequestedRef.current = false
    setHasGenerationTimedOut(false)
    onGenerateRef.current()

    if (generationTimeoutRef.current) clearTimeout(generationTimeoutRef.current)
    generationTimeoutRef.current = setTimeout(
      () => setHasGenerationTimedOut(true),
      GENERATION_TIMEOUT_MS
    )
  }, [])

  const handleCopy = useCallback(async () => {
    if (!unsignedTransaction) return

    try {
      await setStringAsync(unsignedTransaction)
      addToast(t('Copied to clipboard!') as string, { timeout: 2500 })
    } catch {
      addToast(t('Failed to copy') as string)
    }
  }, [addToast, t, unsignedTransaction])

  if (!isViewOnlyEOA) return null

  const isWaitingForEstimation = !gasFeePayment
  const isGenerating = !!gasFeePayment && !unsignedTransaction && !hasGenerationTimedOut

  return (
    <View
      style={[
        spacings.mt,
        spacings.ph,
        spacings.pv,
        {
          borderWidth: 1,
          borderColor: theme.secondaryBorder,
          borderRadius: 12,
          backgroundColor: theme.secondaryBackground
        }
      ]}
    >
      <Text appearance="primaryText" fontSize={14} weight="semiBold" style={spacings.mbSm}>
        {t('Unsigned transaction')}
      </Text>
      <Text appearance="secondaryText" fontSize={12} style={spacings.mb}>
        {t(
          'This account is view-only, so it cannot sign here. You can still prepare the unsigned transaction and sign it with any wallet that holds the private key for this address.'
        )}
      </Text>
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <View style={[flexbox.flex1, spacings.mrSm]}>
          <TextArea
            value={unsignedTransaction ?? ''}
            placeholder={
              isWaitingForEstimation
                ? t('Waiting for estimation…')
                : isGenerating
                  ? t('Generating your unsigned transaction…')
                  : t('Unable to generate')
            }
            disabled
            multiline
            numberOfLines={3}
            inputStyle={spacings.pvMi}
            nativeInputStyle={{ fontFamily: GEIST_MONO_FONT_FAMILIES.REGULAR, fontSize: 12 }}
          />
        </View>
        {hasGenerationTimedOut && !unsignedTransaction ? (
          <Button
            testID="retry-unsigned-transaction-button"
            type="secondary"
            size="small"
            hasBottomSpacing={false}
            onPress={handleRetry}
            text={t('Retry')}
          />
        ) : (
          <Button
            testID="copy-unsigned-transaction-button"
            type="secondary"
            size="small"
            hasBottomSpacing={false}
            disabled={!unsignedTransaction}
            childrenPosition="left"
            onPress={handleCopy}
            text={t('Copy')}
          >
            <CopyIcon
              strokeWidth={1.5}
              width={20}
              height={20}
              color={theme.secondaryText}
              style={spacings.mrTy}
            />
          </Button>
        )}
      </View>
    </View>
  )
}

export default memo(CopyUnsignedTransaction)

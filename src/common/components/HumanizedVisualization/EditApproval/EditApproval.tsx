import { formatUnits } from 'ethers'
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorValue, GestureResponderEvent, StyleProp, View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import { getSafeAmountFromFieldValue } from '@ambire-common/utils/numbers/formatters'
import EditPenIcon from '@common/assets/svg/EditPenIcon'
import AmountInput from '@common/components/AmountInput'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useController from '@common/hooks/useController'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import MaxAmount from '@common/modules/swap-and-bridge/components/MaxAmount'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type EditApprovalAmountInputProps = {
  initialAmount: string
  backgroundColor: ColorValue
  onSanitizedAmountChange: (value: string) => void
  leftIcon: () => React.ReactNode
  decimals?: number
  selectedTokenSymbol?: string
  maxAmount?: number
  getMaxAmountText?: () => string
}

// This component is needed to keep the caret position
// on input change.
const EditApprovalAmountInput = memo(
  ({
    initialAmount,
    backgroundColor,
    onSanitizedAmountChange,
    leftIcon,
    selectedTokenSymbol,
    maxAmount,
    getMaxAmountText,
    decimals
  }: EditApprovalAmountInputProps) => {
    const [draftAmount, setDraftAmount] = useState(initialAmount)

    useEffect(() => {
      setDraftAmount(initialAmount)
    }, [initialAmount])

    const onChange = useCallback(
      (text: string) => {
        setDraftAmount(text)
        onSanitizedAmountChange(getSafeAmountFromFieldValue(text, decimals))
      },
      [decimals, onSanitizedAmountChange]
    )

    const onBlur = useCallback(() => {
      const sanitized = getSafeAmountFromFieldValue(draftAmount, decimals)
      setDraftAmount(sanitized)
      onSanitizedAmountChange(sanitized)
    }, [decimals, draftAmount, onSanitizedAmountChange])

    const onMax = useCallback(() => {
      if (!getMaxAmountText) return
      const max = getMaxAmountText()
      setDraftAmount(max)
      onSanitizedAmountChange(max)
    }, [getMaxAmountText, onSanitizedAmountChange])

    return (
      <>
        <AmountInput
          type="token"
          value={draftAmount}
          onChangeText={onChange}
          onBlur={onBlur}
          fontSize={16}
          backgroundColor={backgroundColor}
          inputWrapperStyle={{ height: 40, ...spacings.prSm }}
          leftIconStyle={spacings.mrTy}
          leftIcon={leftIcon}
        />
        {maxAmount !== undefined && !!selectedTokenSymbol && !!getMaxAmountText && (
          <View style={spacings.mtSm}>
            <MaxAmount
              isLoading={false}
              maxAmount={maxAmount}
              selectedTokenSymbol={selectedTokenSymbol}
              onMaxButtonPress={onMax}
              simulationFailed={false}
            />
          </View>
        )}
      </>
    )
  }
)
const EditApproval = ({
  editCall,
  token,
  value,
  id,
  style
}: {
  editCall: (amount: string, token: string, closeEditApprovals: () => void) => void
  token: string
  value: bigint
  id?: string
  style?: StyleProp<ViewStyle>
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [bindEditApprovals, editApprovalsStyle] = useHover({
    preset: 'opacityInverted'
  })
  const {
    ref: editApprovalsSheetRef,
    open: openEditApprovals,
    close: closeEditApprovals
  } = useModalize()
  const {
    state: { portfolio }
  } = useController('SelectedAccountController')
  const amountRef = useRef<string>('0')
  const [initialAmount, setInitialAmount] = useState<string>('0')
  const [initialValueSet, setInitialValueSet] = useState<boolean>(false)

  const portfolioToken = useMemo(() => {
    // the humanization is also used in benzina (AmbireExplorer)
    // where we don't have access to controllers.
    // Therefore, we need to check whether the portfolio controller exists
    if (!portfolio) return undefined
    return portfolio.tokens.find((t) => t.address.toLowerCase() === token.toLowerCase())
  }, [portfolio, token])

  const maxAmount = useMemo(() => {
    if (!portfolioToken) return undefined
    return Number(formatUnits(getTokenAmount(portfolioToken, true), portfolioToken.decimals))
  }, [portfolioToken])

  const getMaxAmountText = useCallback(() => {
    if (!portfolioToken) return '0'
    return formatUnits(getTokenAmount(portfolioToken, true), portfolioToken.decimals)
  }, [portfolioToken])

  const leftIcon = useCallback(
    () =>
      !!portfolioToken && (
        <TokenIcon
          address={portfolioToken.address}
          chainId={portfolioToken.chainId}
          containerHeight={28}
          containerWidth={28}
          width={28}
          height={28}
          withNetworkIcon={false}
        />
      ),
    [portfolioToken]
  )

  useEffect(() => {
    if (!portfolioToken || initialValueSet) return
    const initialApprovalAmount = formatUnits(value.toString(), portfolioToken.decimals)
    amountRef.current = initialApprovalAmount
    setInitialAmount(initialApprovalAmount)
    setInitialValueSet(true)
  }, [portfolioToken, value, initialValueSet])

  const onSanitizedAmountChange = useCallback((value: string) => {
    amountRef.current = value
  }, [])

  const handleOpenEditApprovals = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation()
      openEditApprovals()
    },
    [openEditApprovals]
  )

  return (
    <>
      <AnimatedPressable
        style={[
          editApprovalsStyle,
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.mrTy,
          { marginLeft: -8 },
          style
        ]}
        {...bindEditApprovals}
        onPress={handleOpenEditApprovals}
      >
        <Text fontSize={14} color={theme.linkText}>
          {'['}
        </Text>
        <EditPenIcon width={20} height={20} color={theme.linkText} />
        <Text fontSize={14} color={theme.linkText}>
          {t('Edit')}
        </Text>
        <Text fontSize={14} color={theme.linkText}>
          {']'}
        </Text>
      </AnimatedPressable>
      <BottomSheet
        sheetRef={editApprovalsSheetRef}
        id={`edit-approvals-bottom-sheet-${id}`}
        type="modal"
        closeBottomSheet={closeEditApprovals}
        style={{ maxWidth: 460 }}
      >
        <View style={flexbox.alignCenter}>
          <Text fontSize={20} weight="medium" style={[spacings.mbXl, spacings.mtTy]}>
            {t('Grant approval for')}
          </Text>
          <View style={{ width: '100%' }}>
            <EditApprovalAmountInput
              initialAmount={initialAmount}
              backgroundColor={theme.tertiaryBackground}
              onSanitizedAmountChange={onSanitizedAmountChange}
              leftIcon={leftIcon}
              selectedTokenSymbol={portfolioToken?.symbol}
              maxAmount={maxAmount}
              decimals={portfolioToken?.decimals}
              getMaxAmountText={portfolioToken ? getMaxAmountText : undefined}
            />
          </View>
          <FooterGlassView absolute={false} style={spacings.mt2Xl}>
            <Button
              type="secondary"
              text={t('Cancel')}
              onPress={() => closeEditApprovals()}
              hasBottomSpacing={false}
              size="smaller"
              style={[{ width: 100 }, spacings.mr]}
            />
            <Button
              type="primary"
              text={t('Save')}
              onPress={() => editCall(amountRef.current, token, closeEditApprovals)}
              hasBottomSpacing={false}
              size="smaller"
              style={[{ width: 100 }]}
            />
          </FooterGlassView>
        </View>
      </BottomSheet>
    </>
  )
}

export default memo(EditApproval)

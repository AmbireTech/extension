import { formatUnits, Interface, parseUnits } from 'ethers'
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorValue, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import {
  noStateUpdateStatuses,
  SigningStatus
} from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { Approve, Permit2 } from '@ambire-common/libs/humanizer/const/abis/Approvals'
import { HumanizerVisualization } from '@ambire-common/libs/humanizer/interfaces'
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

const approveInterface = new Interface(Approve)
const permitInterface = new Interface(Permit2)

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
const EditApproval = ({ item }: { item: HumanizerVisualization }) => {
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
  const { state: signAccountOpState, dispatch: signAccountOpDispatch } =
    useController('SignAccountOpController')
  const amountRef = useRef<string>('0')
  const [initialAmount, setInitialAmount] = useState<string>('0')
  const [initialValueSet, setInitialValueSet] = useState<boolean>(false)

  const portfolioToken = useMemo(() => {
    return portfolio.tokens.find((t) => t.address.toLowerCase() === item.address?.toLowerCase())
  }, [portfolio.tokens, item.address])

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
    if (!portfolioToken || !item.value || initialValueSet) return
    const initialApprovalAmount = formatUnits(item.value.toString(), portfolioToken.decimals)
    amountRef.current = initialApprovalAmount
    setInitialAmount(initialApprovalAmount)
    setInitialValueSet(true)
  }, [portfolioToken, item.value, initialValueSet])

  const onSanitizedAmountChange = useCallback((value: string) => {
    amountRef.current = value
  }, [])

  const setApproval = useCallback(() => {
    const editApprovalData = item.editApprovalData
    if (!signAccountOpState || !item.address || !editApprovalData || !portfolioToken) return

    // shallow copy each call just in case so the controller properly
    // understands that a change to the calls array has been made
    const calls = signAccountOpState.accountOp.calls.map((call) => ({ ...call }))
    const replacedCall = calls.find((c) => c.id === editApprovalData.callId)
    if (!replacedCall) return

    let calldata = ''
    if (replacedCall.data.substring(0, 10) === approveInterface.getFunction('approve')!.selector) {
      calldata = approveInterface.encodeFunctionData('approve', [
        editApprovalData.spenderAddr,
        parseUnits(amountRef.current || '0', portfolioToken.decimals)
      ])
    } else {
      calldata = permitInterface.encodeFunctionData('approve', [
        item.address,
        editApprovalData.spenderAddr,
        parseUnits(amountRef.current || '0', portfolioToken.decimals),
        editApprovalData.expiration
      ])
    }

    // replace the data with the new approval
    replacedCall.data = calldata

    signAccountOpDispatch({
      type: 'method',
      params: {
        method: 'update',
        args: [{ accountOpData: { calls } }]
      }
    })
    closeEditApprovals()
  }, [
    closeEditApprovals,
    item.address,
    item.editApprovalData,
    portfolioToken,
    signAccountOpDispatch,
    signAccountOpState
  ])

  // hide the edit option if there's no sign account op state
  // or it has finished / queued state
  // or the call id for this approval is missing
  if (
    !signAccountOpState ||
    !item.editApprovalData ||
    !signAccountOpState.accountOp.calls.find((c) => c.id === item.editApprovalData?.callId) ||
    (signAccountOpState.status && noStateUpdateStatuses.includes(signAccountOpState.status.type)) ||
    signAccountOpState.status?.type === SigningStatus.Queued
  )
    return null

  return (
    <>
      <AnimatedPressable
        style={[
          editApprovalsStyle,
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.mrTy,
          { marginLeft: -8 }
        ]}
        {...bindEditApprovals}
        onPress={() => openEditApprovals()}
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
        id={`edit-approvals-bottom-sheet-${item.id}`}
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
              onPress={setApproval}
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

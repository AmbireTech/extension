import { formatUnits, Interface, parseUnits } from 'ethers'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import {
  noStateUpdateStatuses,
  SigningStatus
} from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { Approve, Permit2 } from '@ambire-common/libs/humanizer/const/abis/Approvals'
import { HumanizerVisualization } from '@ambire-common/libs/humanizer/interfaces'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import { textToValidDecimal } from '@ambire-common/utils/numbers/formatters'
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

const EditApproval = ({ item }: { item: HumanizerVisualization }) => {
  const { t } = useTranslation()
  const { theme, themeType } = useTheme()
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
  const [amount, setAmount] = useState<string>('0')
  const [initialValueSet, setInitialValueSet] = useState<boolean>(false)

  const portfolioToken = useMemo(() => {
    return portfolio.tokens.find((t) => t.address.toLowerCase() === item.address?.toLowerCase())
  }, [portfolio.tokens, item])

  useEffect(() => {
    if (!portfolioToken || !item.value || initialValueSet) return
    setAmount(formatUnits(item.value.toString(), portfolioToken.decimals))
    setInitialValueSet(true)
  }, [portfolioToken, item.value, initialValueSet])

  const handleOnChangeTextAndFormat = useCallback((text: string) => {
    setAmount(textToValidDecimal(text))
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
        parseUnits(amount, portfolioToken.decimals)
      ])
    } else {
      calldata = permitInterface.encodeFunctionData('approve', [
        item.address,
        editApprovalData.spenderAddr,
        parseUnits(amount, portfolioToken.decimals),
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
    amount,
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
          // @ts-ignore
          { marginLeft: '-8px' }
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
            <AmountInput
              type="token"
              value={amount}
              onChangeText={handleOnChangeTextAndFormat}
              fontSize={16}
              backgroundColor={theme.tertiaryBackground}
              inputWrapperStyle={{ height: 40, ...spacings.prSm }}
              leftIconStyle={spacings.mrTy}
              leftIcon={() =>
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
                )
              }
            />
            {portfolioToken && (
              <View style={spacings.mtSm}>
                <MaxAmount
                  isLoading={false}
                  maxAmount={Number(
                    formatUnits(getTokenAmount(portfolioToken, true), portfolioToken.decimals)
                  )}
                  selectedTokenSymbol={portfolioToken.symbol}
                  onMaxButtonPress={() =>
                    setAmount(
                      formatUnits(getTokenAmount(portfolioToken, true), portfolioToken.decimals)
                    )
                  }
                  simulationFailed={false}
                />
              </View>
            )}
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

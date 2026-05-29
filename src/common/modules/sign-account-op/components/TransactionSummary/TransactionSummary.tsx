import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  decodeFunctionData,
  encodeFunctionData,
  isHex,
  parseAbi,
  parseUnits,
  toFunctionSelector,
  zeroAddress
} from 'viem'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import {
  noStateUpdateStatuses,
  SigningStatus
} from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import {
  getAction,
  getAddressVisualization,
  getLabel,
  getToken
} from '@ambire-common/libs/humanizer/utils'
import DeleteIcon from '@common/assets/svg/DeleteIcon'
import ExpandableCard from '@common/components/ExpandableCard'
import HumanizedVisualization from '@common/components/HumanizedVisualization'
import Label from '@common/components/Label'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useDecodeTransactionData from '@common/hooks/useDecodeTransactionData'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import ExpandedContent from '@common/modules/sign-account-op/components/TransactionSummary/ExpandedContent'
import FallbackVisualization from '@common/modules/sign-account-op/components/TransactionSummary/FallbackVisualization'
import { SPACING_SM } from '@common/styles/spacings'

import getStyles from './styles'

interface Props {
  style: ViewStyle
  call: IrCall
  chainId: bigint
  size?: 'sm' | 'md' | 'lg'
  type?: 'history' | 'benzin' | 'default'
  index?: number
  enableExpand?: boolean
  rightIcon?: React.ReactNode
  onRightIconPress?: () => void
  hideLinks?: boolean
  hideDeleteIcon?: boolean
  hasCallFailed?: boolean
  disableSelectorFetching?: boolean
}

export const sizeMultiplier = {
  sm: 0.75,
  md: 0.85,
  lg: 1
}

const approveAbi = parseAbi(['function approve(address spender, uint256 amount) returns (bool)'])
const permitAbi = parseAbi([
  'function approve(address token, address spender, uint160 amount, uint48 expiration)'
])
const increaseAllowanceAbi = parseAbi([
  'function increaseAllowance(address spender, uint256 amount)'
])
const decreaseAllowanceAbi = parseAbi([
  'function decreaseAllowance(address spender, uint256 amount)'
])

const TransactionSummary = ({
  style,
  call,
  chainId,
  size = 'lg',
  type = 'default',
  index,
  enableExpand = true,
  rightIcon,
  onRightIconPress,
  hideLinks = false,
  hideDeleteIcon,
  hasCallFailed,
  disableSelectorFetching
}: Props) => {
  const textSize = 16 * sizeMultiplier[size]
  const imageSize = 32 * sizeMultiplier[size]
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const { state: signAccountOpState, dispatch: signAccountOpDispatch } =
    useController('SignAccountOpController')
  const {
    state: { portfolio }
  } = useController('SelectedAccountController')
  const { styles } = useTheme(getStyles)
  const { addToast } = useToast()
  const { t } = useTranslation()
  const { decodedFunction, isLoading: isDecodedFunctionLoading } = useDecodeTransactionData(
    call,
    !!disableSelectorFetching
  )

  /**
   * It takes some time to remove the call from the controller state, so we optimistically
   * set this state to true, which hides it immediately.
   */
  const [isCallRemovedOptimistic, setIsCallRemovedOptimistic] = useState(false)

  const [bindDeleteIconAnim, deleteIconAnimStyle] = useHover({
    preset: 'opacityInverted'
  })

  const handleRemoveCall = useCallback(() => {
    if (!call.id || isCallRemovedOptimistic) return

    setIsCallRemovedOptimistic(true)
    requestsDispatch({
      type: 'method',
      params: {
        method: 'rejectCalls',
        args: [{ callIds: [call.id] }]
      }
    })
  }, [isCallRemovedOptimistic, requestsDispatch, call.id])

  useEffect(() => {
    let isMounted = true
    // If for some reason the removal fails, we reset the optimistic state after 1 second
    // A failure is considered if this component is still mounted, as that would mean the call was not removed
    // from the controller state
    if (isCallRemovedOptimistic) {
      const timeout = setTimeout(() => {
        if (!isMounted) return

        setIsCallRemovedOptimistic(false)
      }, 1000)

      return () => {
        isMounted = false
        clearTimeout(timeout)
      }
    }

    return () => {
      isMounted = false
    }
  }, [isCallRemovedOptimistic])

  const humanizerWarningLabels = useMemo(() => {
    if (type !== 'default') return null
    return call.warnings?.map((warning) => {
      return <Label size={size} key={warning.content} text={warning.content} type="warning" />
    })
  }, [type, call.warnings, size])

  const innerEditApproval = useCallback(
    (newAmount: string, token: string, closeEditApprovals: () => void) => {
      if (!signAccountOpState) {
        addToast('Internal error: failed to load account state', { type: 'error' })
        return
      }
      if (!portfolio) {
        addToast("Internal error: we failed to find the token's data", { type: 'error' })
        return
      }
      const portfolioToken = portfolio.tokens.find(
        (t) => t.address.toLowerCase() === token.toLowerCase()
      )
      if (!portfolioToken) {
        addToast("Internal error: we failed to find the token's data", { type: 'error' })
        return
      }
      // shallow copy each call just in case so the controller properly
      // understands that a change to the calls array has been made
      const calls = signAccountOpState.accountOp.calls.map((call) => ({ ...call }))
      const replacedCall = calls.find((c) => c.id === call.id)
      if (!replacedCall) {
        addToast('Internal error: failed to find the transaction in the batch', { type: 'error' })
        return
      }
      const selector = replacedCall.data.slice(0, 10)
      if (!replacedCall.data || replacedCall.data.length < 10 || !isHex(replacedCall.data)) {
        addToast('Internal error: the found transaction is not a token interaction', {
          type: 'error'
        })
        return
      }

      let calldata = ''

      try {
        switch (selector) {
          case toFunctionSelector(approveAbi[0]): {
            const { args } = decodeFunctionData({
              abi: approveAbi,
              data: replacedCall.data
            })
            const [spender] = args
            calldata = encodeFunctionData({
              abi: approveAbi,
              functionName: 'approve',
              args: [spender, parseUnits(newAmount || '0', portfolioToken.decimals)]
            })
            break
          }
          case toFunctionSelector(permitAbi[0]): {
            const { args } = decodeFunctionData({
              abi: permitAbi,
              data: replacedCall.data
            })
            const [token, spender, , expiration] = args
            calldata = encodeFunctionData({
              abi: permitAbi,
              functionName: 'approve',
              args: [
                token,
                spender,
                parseUnits(newAmount || '0', portfolioToken.decimals),
                expiration
              ]
            })
            break
          }
          case toFunctionSelector(increaseAllowanceAbi[0]): {
            const { args } = decodeFunctionData({
              abi: increaseAllowanceAbi,
              data: replacedCall.data
            })
            const [spender] = args
            calldata = encodeFunctionData({
              abi: increaseAllowanceAbi,
              functionName: 'increaseAllowance',
              args: [spender, parseUnits(newAmount || '0', portfolioToken.decimals)]
            })
            break
          }
          case toFunctionSelector(decreaseAllowanceAbi[0]): {
            const { args } = decodeFunctionData({
              abi: decreaseAllowanceAbi,
              data: replacedCall.data
            })
            const [spender] = args
            calldata = encodeFunctionData({
              abi: decreaseAllowanceAbi,
              functionName: 'decreaseAllowance',
              args: [spender, parseUnits(newAmount || '0', portfolioToken.decimals)]
            })
            break
          }
          default:
            addToast('Internal error: failed to edit the approval', { type: 'error' })
            return
        }
      } catch (e) {
        addToast('Internal error: failed to set the approval amount', { type: 'error' })
        return
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
    },
    [addToast, call, portfolio, signAccountOpDispatch, signAccountOpState]
  )

  // this holds all needed data for edit approval
  // if this is undefined, then we hide the 'edit' button
  const editApprovalCallInfo = useMemo(():
    | undefined
    | {
        setter: (amount: string, token: string, closeModal: () => void) => void
        token: string
        amount: bigint
        callId?: string
      } => {
    if (!portfolio) return
    if (!call.to) return
    // hide the edit option if there's no sign account op state
    // or it has finished / queued state
    // or the call id for this approval is missing
    //
    // the signAccountOpState could be missing if we're in benzina
    // or another part of the extension (activity)
    if (
      !signAccountOpState ||
      (signAccountOpState.status &&
        noStateUpdateStatuses.includes(signAccountOpState.status.type)) ||
      signAccountOpState.status?.type === SigningStatus.Queued ||
      signAccountOpState.accountOp.signature
    )
      return

    // used to prevent edit buttons in the history/activity tab
    const callToReplace = signAccountOpState.accountOp.calls.find((c) => c.id === call.id)
    if (!callToReplace) return

    if (!call.data || call.data.length < 10 || !isHex(call.data)) return
    const selector = call.data.slice(0, 10)

    let amount: bigint | undefined
    let token: string | undefined
    try {
      switch (selector) {
        case toFunctionSelector(approveAbi[0]): {
          const { args } = decodeFunctionData({ abi: approveAbi, data: call.data })
          const [, currentAmount] = args
          amount = currentAmount
          token = call.to
          break
        }
        case toFunctionSelector(permitAbi[0]): {
          const { args } = decodeFunctionData({ abi: permitAbi, data: call.data })
          const [_token, , currentAmount] = args
          amount = currentAmount
          token = _token
          break
        }
        case toFunctionSelector(increaseAllowanceAbi[0]): {
          const { args } = decodeFunctionData({
            abi: increaseAllowanceAbi,
            data: call.data
          })
          const [, currentIncrease] = args
          amount = currentIncrease
          token = call.to
          break
        }
        case toFunctionSelector(decreaseAllowanceAbi[0]): {
          const { args } = decodeFunctionData({
            abi: decreaseAllowanceAbi,
            data: call.data
          })
          const [, currentDecrease] = args
          amount = currentDecrease
          token = call.to
          break
        }
        default:
          return
      }
    } catch (e) {
      // the calldata was probably malformed
      // at this point in the code there is no need to display a toast
      return
    }
    if (amount === undefined) return
    if (!token) return
    const portfolioToken = portfolio.tokens.find(
      (t) => t.address.toLowerCase() === token.toLowerCase()
    )
    if (!portfolioToken) return

    return { setter: innerEditApproval, amount, token, callId: call.id }
  }, [call, innerEditApproval, portfolio, signAccountOpState])

  // TODO: should this be reused in history/benzin/other places
  const callVisualization = useMemo(() => {
    if (!call.isFallback) return call.fullVisualization
    if (!call.to) return call.fullVisualization
    if (!call.data || call.data === '0x' || call.data.length < 10) return call.fullVisualization
    if (isDecodedFunctionLoading) return [getLabel('Loading...')]
    if (!decodedFunction) return call.fullVisualization
    const functionName = decodedFunction.signature.split('(')[0]
    if (!functionName || !functionName[0]) return call.fullVisualization

    const capitalizedFunction = functionName[0].toUpperCase() + functionName.slice(1)
    if (call.value) {
      return [
        getAction('Send'),
        getToken(zeroAddress, call.value),
        getLabel('and'),
        getAction(`Call ${capitalizedFunction}`),
        getLabel('from'),
        getAddressVisualization(call.to)
      ]
    } else {
      return [getAction(capitalizedFunction), getLabel('from'), getAddressVisualization(call.to)]
    }
  }, [
    call.data,
    call.fullVisualization,
    call.isFallback,
    call.to,
    call.value,
    decodedFunction,
    isDecodedFunctionLoading
  ])
  if (isCallRemovedOptimistic) return null

  return (
    <ExpandableCard
      enableToggleExpand={enableExpand}
      hasArrow={enableExpand}
      style={{
        ...(call.warnings?.length && type === 'default'
          ? { ...styles.warningContainer, ...style }
          : { ...style })
      }}
      contentStyle={
        isWeb
          ? {
              paddingHorizontal: SPACING_SM,
              paddingVertical: type !== 'history' ? SPACING_SM * sizeMultiplier[size] : 0
            }
          : {}
      }
      content={
        <>
          {callVisualization ? (
            <HumanizedVisualization
              data={callVisualization}
              sizeMultiplierSize={sizeMultiplier[size]}
              textSize={textSize}
              imageSize={imageSize}
              chainId={chainId}
              type={type}
              testID={`recipient-address-${index}`}
              hasPadding={enableExpand}
              hideLinks={hideLinks}
              editApprovalCallInfo={editApprovalCallInfo}
            />
          ) : (
            <FallbackVisualization
              call={call}
              sizeMultiplierSize={sizeMultiplier[size]}
              textSize={textSize}
              hasPadding={enableExpand}
            />
          )}
          {hasCallFailed && (
            <Text fontSize={12} appearance="errorText" weight="semiBold">
              {t('Failed')}
            </Text>
          )}
          {!!call.id && type === 'default' && !rightIcon && !hideDeleteIcon && (
            <AnimatedPressable
              style={deleteIconAnimStyle}
              onPress={handleRemoveCall}
              disabled={isCallRemovedOptimistic}
              {...bindDeleteIconAnim}
              testID={`delete-txn-call-${index}`}
            >
              <DeleteIcon width={isMobile ? 26 : 28} height={isMobile ? 26 : 28} />
            </AnimatedPressable>
          )}
          {rightIcon && onRightIconPress && !hasCallFailed && (
            <AnimatedPressable
              style={deleteIconAnimStyle}
              onPress={onRightIconPress}
              {...bindDeleteIconAnim}
              testID={`right-icon-${index}`}
            >
              {rightIcon}
            </AnimatedPressable>
          )}
        </>
      }
      expandedContent={
        <ExpandedContent
          call={call}
          size={size}
          sizeMultiplier={sizeMultiplier}
          styles={styles}
          decodedFunction={decodedFunction}
          isDecodedFunctionLoading={isDecodedFunctionLoading}
        />
      }
    >
      <View
        style={{
          paddingHorizontal: 42 * sizeMultiplier[size] // magic number
        }}
      >
        {!call.validationError ? (
          humanizerWarningLabels
        ) : (
          <Label size={size} key={call.validationError} text={call.validationError} type="error" />
        )}
      </View>
    </ExpandableCard>
  )
}

export default React.memo(TransactionSummary)

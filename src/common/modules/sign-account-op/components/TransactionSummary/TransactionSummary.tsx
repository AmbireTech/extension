import { Interface, parseUnits, ZeroAddress } from 'ethers'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View, ViewStyle } from 'react-native'

import {
  noStateUpdateStatuses,
  SigningStatus
} from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { HumanizerErc7730Visualization, IrCall } from '@ambire-common/libs/humanizer/interfaces'
import {
  getAction,
  getAddressVisualization,
  getLabel,
  getToken
} from '@ambire-common/libs/humanizer/utils'
import DeleteIcon from '@common/assets/svg/DeleteIcon'
import ExpandableCard from '@common/components/ExpandableCard'
import HumanizedVisualization, {
  getErc7730DescriptionRows,
  shouldUseErc7730DetailedLayout
} from '@common/components/HumanizedVisualization'
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
import { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'

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

const approveInterface = new Interface([
  'function approve(address spender, uint256 amount) returns (bool)'
])
const permitInterface = new Interface([
  'function approve(address token, address spender, uint160 amount, uint48 expiration)'
])

const increaseAllowanceInterface = new Interface([
  'function increaseAllowance(address spender, uint256 amount)'
])

const decreaseAllowanceInterface = new Interface([
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
  const { styles, theme } = useTheme(getStyles)
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
  const [erc7730ExpandedTab, setErc7730ExpandedTab] = useState<'description' | 'raw'>('description')

  const erc7730Visualization = useMemo(
    () =>
      call.fullVisualization?.find(
        (item): item is HumanizerErc7730Visualization & { id: number } => item.type === 'erc7730'
      ),
    [call.fullVisualization]
  )

  const erc7730DescriptionVisualization = useMemo(() => {
    if (!erc7730Visualization) return null

    const descriptionRows = getErc7730DescriptionRows(erc7730Visualization)
    if (!descriptionRows.length) return null

    return {
      ...erc7730Visualization,
      rows: descriptionRows
    }
  }, [erc7730Visualization])

  const shouldUseDetailedErc7730Layout = useMemo(
    () => !!erc7730Visualization && shouldUseErc7730DetailedLayout(erc7730Visualization),
    [erc7730Visualization]
  )

  const erc7730DetailedTitle = useMemo(() => {
    if (!erc7730Visualization) return ''

    return erc7730Visualization.title || call.dapp?.name || t('Transaction details')
  }, [call.dapp?.name, erc7730Visualization, t])
  const erc7730DetailedIcon = erc7730Visualization?.dapp?.icon || call.dapp?.icon

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

  useEffect(() => {
    if (erc7730DescriptionVisualization) setErc7730ExpandedTab('description')
  }, [erc7730DescriptionVisualization])

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
      if (!replacedCall.data || replacedCall.data.length < 10) {
        addToast('Internal error: the found transaction is not a token interaction', {
          type: 'error'
        })
        return
      }

      let calldata = ''

      switch (selector) {
        case approveInterface.getFunction('approve')!.selector: {
          const tx = approveInterface.parseTransaction(call)
          if (!tx) {
            addToast('Internal error: failed to set the approval amount', { type: 'error' })
            return
          }
          const [spender, currentAmount] = tx.args
          calldata = approveInterface.encodeFunctionData('approve', [
            spender,
            parseUnits(newAmount || '0', portfolioToken.decimals)
          ])
          break
        }
        case permitInterface.getFunction('approve')!.selector: {
          const tx = permitInterface.parseTransaction(call)
          if (!tx) {
            addToast('Internal error: failed to set the approval amount', { type: 'error' })
            return
          }
          const [token, spender, currentAmount, expiration] = tx.args
          calldata = permitInterface.encodeFunctionData('approve', [
            token,
            spender,
            parseUnits(newAmount || '0', portfolioToken.decimals),
            expiration
          ])
          break
        }
        case increaseAllowanceInterface.getFunction('increaseAllowance')!.selector: {
          const tx = increaseAllowanceInterface.parseTransaction(call)
          if (!tx) {
            addToast('Internal error: failed to set the approval amount', { type: 'error' })
            return
          }
          const [spender, amount] = tx.args
          calldata = increaseAllowanceInterface.encodeFunctionData('increaseAllowance', [
            spender,
            parseUnits(newAmount || '0', portfolioToken.decimals)
          ])
          break
        }
        case decreaseAllowanceInterface.getFunction('decreaseAllowance')!.selector: {
          const tx = decreaseAllowanceInterface.parseTransaction(call)
          if (!tx) {
            addToast('Internal error: failed to set the approval amount', { type: 'error' })
            return
          }
          const [spender, amount] = tx.args
          calldata = decreaseAllowanceInterface.encodeFunctionData('decreaseAllowance', [
            spender,
            parseUnits(newAmount || '0', portfolioToken.decimals)
          ])
          break
        }
        default:
          addToast('Internal error: failed to edit the approval', { type: 'error' })
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

    if (!call.data || call.data.length < 10) return
    const selector = call.data.slice(0, 10)

    let amount: bigint | undefined
    let token: string | undefined
    try {
      switch (selector) {
        case approveInterface.getFunction('approve')!.selector: {
          const tx = approveInterface.parseTransaction(call)
          if (!tx) return
          const [spender, currentAmount] = tx.args
          amount = currentAmount
          token = call.to
          break
        }
        case permitInterface.getFunction('approve')!.selector: {
          const tx = permitInterface.parseTransaction(call)
          if (!tx) return
          const [_token, spender, currentAmount, expiration] = tx.args
          amount = currentAmount
          token = _token
          break
        }
        case increaseAllowanceInterface.getFunction('increaseAllowance')!.selector: {
          const tx = increaseAllowanceInterface.parseTransaction(call)
          if (!tx) return
          const [spender, currentIncrease] = tx.args
          amount = currentIncrease
          token = call.to
          break
        }
        case decreaseAllowanceInterface.getFunction('decreaseAllowance')!.selector: {
          const tx = decreaseAllowanceInterface.parseTransaction(call)
          if (!tx) return
          const [spender, currentDecrease] = tx.args
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
        getToken(ZeroAddress, call.value),
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
            shouldUseDetailedErc7730Layout && erc7730Visualization ? (
              <View style={{ flex: 1, minWidth: 0 }}>
                <View
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    { marginBottom: SPACING_TY * sizeMultiplier[size], minWidth: 0 }
                  ]}
                >
                  {!!erc7730DetailedIcon && (
                    <ManifestImage
                      uri={erc7730DetailedIcon}
                      containerStyle={{ marginRight: SPACING_TY * sizeMultiplier[size] }}
                      size={24 * sizeMultiplier[size]}
                      skeletonAppearance="secondaryBackground"
                      imageStyle={{
                        borderRadius: 12 * sizeMultiplier[size],
                        backgroundColor: 'transparent'
                      }}
                    />
                  )}
                  <Text
                    fontSize={textSize + 2}
                    weight="semiBold"
                    color={theme.secondaryAccent400}
                    numberOfLines={1}
                    style={{ flexShrink: 1 }}
                  >
                    {erc7730DetailedTitle}
                  </Text>
                </View>
                <View
                  style={{
                    height: 1,
                    width: '100%',
                    backgroundColor: theme.secondaryBorder,
                    marginBottom: SPACING_TY * sizeMultiplier[size]
                  }}
                />
                <HumanizedVisualization
                  data={[erc7730Visualization]}
                  sizeMultiplierSize={sizeMultiplier[size]}
                  textSize={Math.max(textSize - 1, 12)}
                  imageSize={imageSize}
                  chainId={chainId}
                  type={type}
                  testID={`recipient-address-${index}`}
                  hasPadding={false}
                  hideLinks={hideLinks}
                  erc7730Mode="description"
                />
              </View>
            ) : (
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
                dapp={call.dapp}
              />
            )
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
        erc7730Visualization && !shouldUseDetailedErc7730Layout ? (
          <View
            style={{
              paddingHorizontal: SPACING_SM * sizeMultiplier[size],
              paddingBottom: SPACING_SM * sizeMultiplier[size]
            }}
          >
            {!!erc7730DescriptionVisualization && (
              <View
                style={{
                  alignSelf: 'stretch',
                  flexDirection: 'row',
                  borderBottomWidth: 1,
                  borderBottomColor: theme.secondaryBorder,
                  marginBottom: SPACING_SM * sizeMultiplier[size]
                }}
              >
                {(
                  [
                    ['description', t('Additional description')],
                    ['raw', t('Raw data')]
                  ] as const
                ).map(([tab, label]) => {
                  const isActive = erc7730ExpandedTab === tab

                  return (
                    <Pressable
                      key={tab}
                      onPress={(e: any) => {
                        e?.stopPropagation?.()
                        setErc7730ExpandedTab(tab)
                      }}
                      style={{
                        paddingVertical: SPACING_TY * sizeMultiplier[size],
                        marginRight: SPACING_TY,
                        borderBottomWidth: 2,
                        borderBottomColor: isActive ? theme.secondaryAccent400 : 'transparent'
                      }}
                    >
                      <Text
                        fontSize={14 * sizeMultiplier[size]}
                        weight={isActive ? 'semiBold' : 'medium'}
                        color={isActive ? theme.secondaryAccent400 : theme.secondaryText}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            )}
            {!!erc7730DescriptionVisualization && erc7730ExpandedTab === 'description' ? (
              <HumanizedVisualization
                data={[erc7730DescriptionVisualization]}
                sizeMultiplierSize={sizeMultiplier[size]}
                textSize={Math.max(textSize - 1, 12)}
                imageSize={imageSize}
                chainId={chainId}
                type={type}
                hasPadding={false}
                hideLinks={hideLinks}
                erc7730Mode="description"
              />
            ) : (
              <ExpandedContent
                call={call}
                size={size}
                sizeMultiplier={sizeMultiplier}
                styles={styles}
                decodedFunction={decodedFunction}
                isDecodedFunctionLoading={isDecodedFunctionLoading}
              />
            )}
          </View>
        ) : (
          <ExpandedContent
            call={call}
            size={size}
            sizeMultiplier={sizeMultiplier}
            styles={styles}
            decodedFunction={decodedFunction}
            isDecodedFunctionLoading={isDecodedFunctionLoading}
          />
        )
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

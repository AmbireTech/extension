import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, Pressable, View, ViewStyle } from 'react-native'
import {
  decodeFunctionData,
  encodeFunctionData,
  isHex,
  parseAbi,
  parseUnits,
  toFunctionSelector,
  zeroAddress
} from 'viem'

import {
  noStateUpdateStatuses,
  SigningStatus
} from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { DecodedCall } from '@ambire-common/interfaces/decodeCall'
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
import spacings, { SPACING_MI, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
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
  hideDeleteIcon?: boolean
  hasCallFailed?: boolean
  disableSelectorFetching?: boolean
}

export const sizeMultiplier = {
  sm: 0.75,
  md: 0.85,
  lg: 1
}

type Tab = 'description' | 'raw' | 'parsed'

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

const DataArgs = ({
  decodedArgs,
  indent = 0,
  key
}: {
  decodedArgs: DecodedCall['args']
  indent?: number
  key: string
}) => {
  const { theme } = useTheme(getStyles)
  const breakableStyle = {
    color: theme.secondaryText,
    wordBreak: 'break-all'
  } as any
  if (!decodedArgs.length)
    return (
      <Text selectable fontSize={12} style={breakableStyle}>
        {'Empty list'}
      </Text>
    )

  return decodedArgs.map((arg, index) => {
    return (
      <View
        key={`${key}-${index}`}
        style={{ marginLeft: SPACING_MI * indent, flexDirection: 'column' }}
      >
        {Array.isArray(arg.val) ? (
          <View>
            <Text selectable fontSize={12} style={breakableStyle}>
              {`${arg.key}: [`}
            </Text>
            <DataArgs decodedArgs={arg.val} indent={indent + 1} key={`${key}-${index}`} />
            <Text selectable fontSize={12} style={breakableStyle}>
              {`]`}
            </Text>
          </View>
        ) : typeof arg.val === 'object' ? (
          <View>
            <Text selectable fontSize={12} style={breakableStyle}>
              {`${arg.key}: function call `}
              <Text selectable fontSize={12} style={[breakableStyle, { fontWeight: '900' }]}>
                {arg.val.signature}
              </Text>
            </Text>
            <Text selectable fontSize={12} style={breakableStyle}>
              {`Selector: ${arg.val.selector}`}
            </Text>

            <DataArgs decodedArgs={arg.val.args} indent={indent + 1} key={`${key}-${index}`} />
          </View>
        ) : (
          <Text selectable fontSize={12} style={breakableStyle}>
            {arg.key}: {arg.val.toString()}
          </Text>
        )}
        {isWeb ? <br /> : <View style={{ marginBottom: SPACING_MI }} />}
      </View>
    )
  })
}

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

  const [currentTxDataTab, setCurrentTxDataTab] = useState<Tab>(
    !!erc7730DescriptionVisualization ? 'description' : 'raw'
  )

  const shouldUseDetailedErc7730Layout = useMemo(
    () => !!erc7730Visualization && shouldUseErc7730DetailedLayout(erc7730Visualization),
    [erc7730Visualization]
  )

  const erc7730DetailedTitle = useMemo(() => {
    if (!erc7730Visualization) return ''

    return erc7730Visualization.title || call.dapp?.name || t('Transaction details')
  }, [call.dapp?.name, erc7730Visualization, t])
  const erc7730DetailedIcon = erc7730Visualization?.dapp?.icon || call.dapp?.icon
  const erc7730VisualizationKey = useMemo(
    () => `${call.id || ''}-${call.to || ''}-${call.data}-${call.value.toString()}-${index || ''}`,
    [call.id, call.to, call.data, call.value, index]
  )

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

  const handleErc7730ExpandedTabPress = useCallback((event: GestureResponderEvent, tab: Tab) => {
    event.stopPropagation()
    setCurrentTxDataTab(tab)
  }, [])

  const humanizerWarningLabels = useMemo(() => {
    if (type !== 'default') return null
    return call.warnings?.map((warning) => {
      return <Label size={size} key={warning.content} text={warning.content} type="warning" />
    })
  }, [type, call.warnings, size])

  const innerEditApproval = useCallback(
    (newAmount: string, token: string, tokenChainId: bigint, closeEditApprovals: () => void) => {
      if (!signAccountOpState) {
        addToast('Internal error: failed to load account state', { type: 'error' })
        return
      }
      if (!portfolio) {
        addToast("Internal error: we failed to find the token's data", { type: 'error' })
        return
      }
      const portfolioToken = portfolio.tokens.find(
        (t) => t.address.toLowerCase() === token.toLowerCase() && t.chainId === tokenChainId
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
      } catch {
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
        setter: (
          amount: string,
          token: string,
          tokenChainId: bigint,
          closeModal: () => void
        ) => void
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
    } catch {
      // the calldata was probably malformed
      // at this point in the code there is no need to display a toast
      return
    }
    if (amount === undefined) return
    if (!token) return
    const portfolioToken = portfolio.tokens.find(
      (t) => t.address.toLowerCase() === token.toLowerCase() && t.chainId === chainId
    )
    if (!portfolioToken) return

    return { setter: innerEditApproval, amount, token, callId: call.id }
  }, [call, chainId, innerEditApproval, portfolio, signAccountOpState])

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
  const shouldShowDeleteControl = !!call.id && type === 'default' && !rightIcon && !hideDeleteIcon
  const shouldShowRightControl = !!rightIcon && !!onRightIconPress && !hasCallFailed
  const rightControl = useMemo(() => {
    if (!shouldShowDeleteControl && !shouldShowRightControl) return null

    return (
      <>
        {shouldShowDeleteControl && (
          <AnimatedPressable
            style={[deleteIconAnimStyle, flexbox.alignSelfStart]}
            onPress={handleRemoveCall}
            disabled={isCallRemovedOptimistic}
            {...bindDeleteIconAnim}
            testID={`delete-txn-call-${index}`}
          >
            <DeleteIcon width={isMobile ? 26 : 28} height={isMobile ? 26 : 28} />
          </AnimatedPressable>
        )}
        {shouldShowRightControl && (
          <AnimatedPressable
            style={[{ ...deleteIconAnimStyle }, spacings.mlTy]}
            onPress={onRightIconPress}
            {...bindDeleteIconAnim}
            testID={`right-icon-${index}`}
          >
            {rightIcon}
          </AnimatedPressable>
        )}
      </>
    )
  }, [
    bindDeleteIconAnim,
    deleteIconAnimStyle,
    handleRemoveCall,
    index,
    isCallRemovedOptimistic,
    onRightIconPress,
    rightIcon,
    shouldShowDeleteControl,
    shouldShowRightControl
  ])
  const mobileErc7730Title = useMemo(() => {
    if (!erc7730Visualization) return null

    const icon = shouldUseDetailedErc7730Layout
      ? erc7730DetailedIcon
      : erc7730Visualization.dapp?.icon
    const title = shouldUseDetailedErc7730Layout ? erc7730DetailedTitle : erc7730Visualization.title

    if (!icon && !title) return null

    return (
      <View style={[flexbox.directionRow, flexbox.alignCenter, { minWidth: 0 }]}>
        {!!icon && (
          <ManifestImage
            uri={icon}
            containerStyle={spacings.mrTy}
            size={24 * sizeMultiplier[size]}
            skeletonAppearance="secondaryBackground"
            imageStyle={{
              borderRadius: 12 * sizeMultiplier[size],
              backgroundColor: 'transparent'
            }}
            hideOnError
          />
        )}
        {!!title && (
          <Text
            fontSize={textSize + 2}
            weight="semiBold"
            color={theme.secondaryAccent400}
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {title}
          </Text>
        )}
      </View>
    )
  }, [
    erc7730DetailedIcon,
    erc7730DetailedTitle,
    erc7730Visualization,
    shouldUseDetailedErc7730Layout,
    size,
    textSize,
    theme
  ])
  const mobileFlatVisualization = useMemo(() => {
    if (!isMobile || !callVisualization || erc7730Visualization) return null

    const firstContentIndex = callVisualization.findIndex((item) => item && item.type !== 'break')
    const visualizationData =
      firstContentIndex > 0 ? callVisualization.slice(firstContentIndex) : callVisualization

    return (
      <HumanizedVisualization
        data={visualizationData}
        sizeMultiplierSize={sizeMultiplier[size]}
        textSize={textSize}
        imageSize={imageSize}
        chainId={chainId}
        type={type}
        testID={`recipient-address-${index}`}
        hasPadding={false}
        style={{ width: '100%', alignContent: 'flex-start' }}
        disableFlex
        editApprovalCallInfo={editApprovalCallInfo}
        dapp={call.dapp}
      />
    )
  }, [
    call.dapp,
    callVisualization,
    chainId,
    editApprovalCallInfo,
    erc7730Visualization,
    imageSize,
    index,
    size,
    textSize,
    type
  ])

  const tabOptions = useMemo(() => {
    let tabs: ([Tab, string] | null)[] = [
      !!erc7730DescriptionVisualization ? ['description', t('Additional description')] : null,
      ['raw', t('Raw data')],
      decodedFunction ? ['parsed', t('Parsed data')] : null
    ]

    return tabs.filter((x) => !!x)
  }, [erc7730DescriptionVisualization, decodedFunction, t])
  const shouldAlignContentStart = useMemo(() => {
    if (type !== 'default') return false
    if (!callVisualization || hasCallFailed) return true
    if (shouldUseDetailedErc7730Layout && erc7730Visualization) return true

    return callVisualization.some((item) => item?.type === 'break')
  }, [
    callVisualization,
    erc7730Visualization,
    hasCallFailed,
    shouldUseDetailedErc7730Layout,
    type
  ])

  if (isCallRemovedOptimistic) return null

  return (
    <ExpandableCard
      enableToggleExpand={enableExpand}
      hasArrow={enableExpand}
      mobileHeaderContent={isMobile ? rightControl : undefined}
      mobileHeaderTitle={isMobile ? mobileErc7730Title || mobileFlatVisualization : undefined}
      mobileHeaderStyle={
        isMobile && mobileFlatVisualization
          ? spacings.pvTy
          : isMobile && shouldUseDetailedErc7730Layout
            ? spacings.pt
            : undefined
      }
      hideMobileContent={!!mobileFlatVisualization}
      overlayMobileHeaderControls={!!mobileFlatVisualization}
      style={{
        ...(call.warnings?.length && type === 'default'
          ? { ...styles.warningContainer, ...style }
          : { ...style })
      }}
      contentStyle={
        isWeb
          ? {
              paddingHorizontal: SPACING_SM,
              paddingVertical: type !== 'history' ? SPACING_SM * sizeMultiplier[size] : 0,
              ...(shouldAlignContentStart ? flexbox.alignStart : {})
            }
          : shouldAlignContentStart
            ? flexbox.alignStart
            : undefined
      }
      content={
        <>
          {callVisualization ? (
            shouldUseDetailedErc7730Layout && erc7730Visualization ? (
              <View style={[{ flex: 1, minWidth: 0 }, spacings.phSm]}>
                {!isMobile && (
                  <>
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
                          hideOnError
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
                  </>
                )}
                <HumanizedVisualization
                  data={[erc7730Visualization]}
                  sizeMultiplierSize={sizeMultiplier[size]}
                  textSize={Math.max(textSize - 1, 12)}
                  imageSize={imageSize}
                  chainId={chainId}
                  type={type}
                  testID={`recipient-address-${index}`}
                  hasPadding={false}
                  erc7730Mode="description"
                  editApprovalCallInfo={editApprovalCallInfo}
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
                editApprovalCallInfo={editApprovalCallInfo}
                hideMobileErc7730Title={!!mobileErc7730Title}
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
          {!isMobile && rightControl}
        </>
      }
      expandedContent={
        <View
          key={erc7730VisualizationKey}
          style={{
            paddingHorizontal: SPACING_SM * sizeMultiplier[size],
            paddingBottom: SPACING_SM * sizeMultiplier[size]
          }}
        >
          {tabOptions.length > 1 && (
            <View
              style={{
                alignSelf: 'stretch',
                flexDirection: 'row',
                borderBottomWidth: 1,
                borderBottomColor: theme.secondaryBorder,
                marginBottom: SPACING_SM * sizeMultiplier[size]
              }}
            >
              {tabOptions.map(([tab, label]) => {
                const isActive = currentTxDataTab === tab

                return (
                  <Pressable
                    key={tab}
                    onPress={(event) => handleErc7730ExpandedTabPress(event, tab)}
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
          {!!erc7730DescriptionVisualization && currentTxDataTab === 'description' ? (
            <HumanizedVisualization
              data={[erc7730DescriptionVisualization]}
              sizeMultiplierSize={sizeMultiplier[size]}
              textSize={Math.max(textSize - 1, 12)}
              imageSize={imageSize}
              chainId={chainId}
              type={type}
              hasPadding={false}
              erc7730Mode="description"
              editApprovalCallInfo={editApprovalCallInfo}
            />
          ) : currentTxDataTab === 'raw' ? (
            <ExpandedContent
              call={call}
              size={size}
              sizeMultiplier={sizeMultiplier}
              styles={styles}
            />
          ) : decodedFunction ? (
            <View style={styles.bodyText}>
              <Text selectable style={{ color: theme.secondaryText }} fontSize={12}>
                {t('Function to call: ')}
                {decodedFunction.signature}
              </Text>
              <Text style={{ color: theme.secondaryText }} fontSize={12}>
                {t('Decoded function arguments:')}
              </Text>
              <DataArgs decodedArgs={decodedFunction.args} key="" />
            </View>
          ) : null}
        </View>
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

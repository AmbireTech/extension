import { formatUnits } from 'ethers'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'

import humanizerInfo from '@ambire-common/consts/humanizer/humanizerInfo.json'
import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import DeleteIcon from '@common/assets/svg/DeleteIcon'
import Alert from '@common/components/Alert'
import ExpandableCard from '@common/components/ExpandableCard'
import HumanizedVisualization from '@common/components/HumanizedVisualization'
import Label from '@common/components/Label'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import FallbackVisualization from '@common/modules/sign-account-op/components/TransactionSummary/FallbackVisualization'
import { SPACING_SM, SPACING_TY } from '@common/styles/spacings'

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
}

export const sizeMultiplier = {
  sm: 0.75,
  md: 0.85,
  lg: 1
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
  hideLinks = false,
  hideDeleteIcon,
  hasCallFailed
}: Props) => {
  const textSize = 16 * sizeMultiplier[size]
  const imageSize = 32 * sizeMultiplier[size]
  const { t } = useTranslation()
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const { styles } = useTheme(getStyles)
  /**
   * It takes some time to remove the call from the controller state, so we optimistically
   * set this state to true, which hides it immediately.
   */
  const [isCallRemovedOptimistic, setIsCallRemovedOptimistic] = useState(false)

  const foundCallSignature = useMemo(() => {
    let foundSigHash: string | undefined
    Object.values(humanizerInfo.abis).some((abi) => {
      Object.values(abi).some((s) => {
        if (call.data && s.selector === call.data.slice(0, 10)) {
          foundSigHash = s.signature
          return true
        }
        return false
      })
      return !!foundSigHash
    })
    return foundSigHash
  }, [call.data])

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
      contentStyle={{
        paddingHorizontal: SPACING_SM,
        paddingVertical: type !== 'history' ? SPACING_SM * sizeMultiplier[size] : 0,
        borderColor: 'red'
      }}
      content={
        <>
          {call.fullVisualization ? (
            <HumanizedVisualization
              data={call.fullVisualization}
              sizeMultiplierSize={sizeMultiplier[size]}
              textSize={textSize}
              imageSize={imageSize}
              chainId={chainId}
              type={type}
              testID={`recipient-address-${index}`}
              hasPadding={enableExpand}
              hideLinks={hideLinks}
            />
          ) : (
            <FallbackVisualization
              call={call}
              sizeMultiplierSize={sizeMultiplier[size]}
              textSize={textSize}
              hasPadding={enableExpand}
            />
          )}
          {hasCallFailed && <Alert type="error" title="Broadcast failed" size="sm" />}
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
        <View
          style={{
            paddingHorizontal: SPACING_SM * sizeMultiplier[size],
            paddingVertical: SPACING_TY * sizeMultiplier[size]
          }}
        >
          {call.to && (
            <Text selectable fontSize={12} style={styles.bodyText} weight="mono_regular">
              <Text fontSize={12} style={styles.bodyText} weight="regular">
                {t('Interacting with (to): ')}
              </Text>
              {call.to}
            </Text>
          )}
          {foundCallSignature && (
            <Text selectable fontSize={12} style={styles.bodyText}>
              <Text fontSize={12} style={styles.bodyText} weight="regular">
                {t('Function to call: ')}
              </Text>
              {foundCallSignature}
            </Text>
          )}
          <Text selectable fontSize={12} style={styles.bodyText}>
            <Text fontSize={12} style={styles.bodyText} weight="regular">
              {t('Value to be sent (value): ')}
            </Text>
            {formatUnits(call.value || '0x0', 18)}
          </Text>
          <Text selectable fontSize={12} style={styles.bodyText}>
            <Text fontSize={12} style={styles.bodyText} weight="regular">
              {t('Data: ')}
            </Text>
            <Text fontSize={12} style={styles.bodyText} weight="mono_regular">
              {call.data}
            </Text>
          </Text>
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

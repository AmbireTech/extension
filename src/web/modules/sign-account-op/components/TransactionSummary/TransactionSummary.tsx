import { formatUnits } from 'ethers'
import React, { useCallback, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import humanizerInfo from '@ambire-common/consts/humanizer/humanizerInfo.json'
import { NetworkId } from '@ambire-common/interfaces/network'
import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import DeleteIcon from '@common/assets/svg/DeleteIcon'
import ExpandableCard from '@common/components/ExpandableCard'
import HumanizedVisualization from '@common/components/HumanizedVisualization'
import Label from '@common/components/Label'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'

import FallbackVisualization from './FallbackVisualization'
import getStyles from './styles'

interface Props {
  style: ViewStyle
  call: IrCall
  networkId: NetworkId
  size?: 'sm' | 'md' | 'lg'
  isHistory?: boolean
  index?: number
  enableExpand?: boolean
}

export const sizeMultiplier = {
  sm: 0.75,
  md: 0.85,
  lg: 1
}

const TransactionSummary = ({
  style,
  call,
  networkId,
  size = 'lg',
  isHistory,
  index,
  enableExpand = true
}: Props) => {
  const textSize = 16 * sizeMultiplier[size]
  const imageSize = 32 * sizeMultiplier[size]
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { styles } = useTheme(getStyles)
  const foundCallSignature = useMemo(() => {
    let foundSigHash: string | undefined
    Object.values(humanizerInfo.abis).some((abi) => {
      Object.values(abi).some((s) => {
        if (s.selector === call.data.slice(0, 10)) {
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
    dispatch({
      type: 'MAIN_CONTROLLER_REJECT_USER_REQUEST',
      params: { err: 'User rejected the request.', id: call.fromUserRequestId as number }
    })
  }, [call.fromUserRequestId, dispatch])

  return (
    <ExpandableCard
      enableExpand={enableExpand}
      hasArrow={enableExpand}
      style={{
        ...(call.warnings?.length ? { ...styles.warningContainer, ...style } : { ...style })
      }}
      contentStyle={{
        paddingHorizontal: SPACING_SM * sizeMultiplier[size],
        paddingVertical: SPACING_TY * sizeMultiplier[size]
      }}
      content={
        <>
          {call.fullVisualization ? (
            <HumanizedVisualization
              data={call.fullVisualization}
              sizeMultiplierSize={sizeMultiplier[size]}
              textSize={textSize}
              imageSize={imageSize}
              networkId={networkId}
              isHistory={isHistory}
              testID={`recipient-address-${index}`}
              hasPadding={enableExpand}
            />
          ) : (
            <FallbackVisualization
              call={call}
              sizeMultiplierSize={sizeMultiplier[size]}
              textSize={textSize}
              hasPadding={enableExpand}
            />
          )}
          {!!call.fromUserRequestId && !isHistory && (
            <AnimatedPressable
              style={deleteIconAnimStyle}
              onPress={handleRemoveCall}
              {...bindDeleteIconAnim}
              testID={`delete-txn-call-${index}`}
            >
              <DeleteIcon />
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
            <Text selectable fontSize={12} style={styles.bodyText}>
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
            <Text fontSize={12} style={styles.bodyText}>
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
        {call.warnings?.map((warning) => {
          return (
            <Label
              size={size}
              key={warning.content + warning.level}
              text={warning.content}
              type="warning"
            />
          )
        })}
      </View>
    </ExpandableCard>
  )
}

export default React.memo(TransactionSummary)

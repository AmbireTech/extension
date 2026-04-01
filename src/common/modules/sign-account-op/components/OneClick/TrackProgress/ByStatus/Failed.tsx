import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Hex } from '@ambire-common/interfaces/hex'
import RetryIcon from '@common/assets/svg/RetryIcon'
import AlertVertical from '@common/components/AlertVertical'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type FailedProps = {
  title: string
  errorMessage: string
  toToken?: {
    chainId: string
    address: Hex
  }
  amount?: string
  handleClose?: () => void
}

const Failed: FC<FailedProps> = ({ title, errorMessage, handleClose, toToken, amount }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { dispatch: swapAndBridgeDispatch } = useController('SwapAndBridgeController')
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: hexToRgba(theme.primaryAccent, 0.08),
      to: hexToRgba(theme.primaryAccent, 0.2)
    }
  })

  return (
    <View>
      <View
        style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyCenter, spacings.mbLg]}
      >
        <AlertVertical size="md" title={title} text={errorMessage}>
          {!!toToken && (
            <AnimatedPressable
              style={{
                borderRadius: 50,
                ...flexbox.directionRow,
                ...flexbox.alignCenter,
                ...spacings.pvSm,
                ...spacings.ph,
                ...spacings.mt,
                ...animStyle
              }}
              onPress={() => {
                swapAndBridgeDispatch({
                  type: 'method',
                  params: {
                    method: 'updateForm',
                    args: [
                      {
                        toSelectedTokenAddr: toToken?.address,
                        toChainId: BigInt(toToken?.chainId),
                        fromAmount: amount
                      },
                      {
                        shouldIncrementFromAmountUpdateCounter: true
                      }
                    ]
                  }
                })
                if (handleClose) handleClose()
              }}
              {...bindAnim}
            >
              <Text fontSize={12} weight="medium" color={theme.primary} style={spacings.mrTy}>
                {t('Retry')}
              </Text>
              <RetryIcon color={theme.primary} />
            </AnimatedPressable>
          )}
        </AlertVertical>
      </View>
    </View>
  )
}

export default Failed

import React from 'react'
import { View, ViewStyle } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import ErrorIcon from '@common/assets/svg/ErrorIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import SuccessIcon from '@common/assets/svg/SuccessIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Text from '@common/components/Text'
import { Toast as ToastType } from '@common/contexts/toastContext'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { TAB_CONTENT_WIDTH } from '@web/constants/spacings'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import { AnimatedPressable, useMultiHover } from '@web/hooks/useHover'
import { getUiType } from '@web/utils/uiType'

import { parseTextLinks } from './helpers'
import { ParsedTextLink } from './types'

const { isPopup } = getUiType()

const TOAST_CLOSE_BACKGROUND_COLOR = {
  success: '#0186491A',
  error: '#EA01291A',
  warning: '#CA7E041A',
  info: '#6000FF1A'
}

const ICON_MAP = {
  error: ErrorIcon,
  warning: WarningIcon,
  success: SuccessIcon,
  info: InfoIcon,
  info2: InfoIcon
}

const ANIMATION_VALUES: {
  property: keyof ViewStyle
  from: number
  to: number
}[] = [
  {
    property: 'width',
    from: 20,
    to: 32
  },
  {
    property: 'height',
    from: 20,
    to: 32
  },
  {
    property: 'top',
    from: 0.5,
    to: -5.5
  },
  {
    property: 'right',
    from: 0.5,
    to: -5.5
  }
]

const Toast = ({
  text,
  type = 'success',
  id,
  removeToast,
  isTypeLabelHidden
}: ToastType & {
  removeToast: (id: number) => void
}) => {
  const { theme } = useTheme()
  const parsedText = parseTextLinks(text)

  const Icon = ICON_MAP[type]

  const [bindAnim, animStyle] = useMultiHover({
    values: ANIMATION_VALUES
  })

  return (
    <View
      style={{
        maxWidth: TAB_CONTENT_WIDTH,
        width: '100%',
        ...common.borderRadiusPrimary,
        ...spacings.mbTy,
        ...common.shadowSecondary
      }}
      testID={`${type}-${id}`}
    >
      <View
        style={[
          !isPopup ? spacings.ph : spacings.phSm,
          !isPopup ? spacings.pv : spacings.pvSm,
          flexbox.directionRow,
          common.borderRadiusPrimary,
          {
            borderWidth: 1,
            backgroundColor: theme[`${type}Background`],
            borderColor: theme[`${type}Decorative`]
          }
        ]}
      >
        <Icon width={20} height={20} color={theme[`${type}Decorative`]} />

        <View style={[flexbox.flex1, spacings.mlTy]}>
          <Text style={spacings.mrXl}>
            {!isTypeLabelHidden && (
              <Text
                selectable
                appearance={`${type}Text`}
                fontSize={14}
                weight="semiBold"
                style={{ textTransform: 'capitalize' }}
              >
                {type}:{' '}
              </Text>
            )}
            <Text selectable appearance={`${type}Text`} fontSize={14} weight="semiBold">
              {parsedText.map((element: string | ParsedTextLink) => {
                if (typeof element === 'string') {
                  return element
                }

                return (
                  <Text
                    key={`link-${element.index}`}
                    appearance={type ? `${type}Text` : 'infoText'}
                    fontSize={14}
                    weight="semiBold"
                    style={{ textDecorationLine: 'underline', cursor: 'pointer' } as any}
                    onPress={async () => {
                      await openInTab({ url: element.url })
                    }}
                  >
                    {element.text}
                  </Text>
                )
              })}
            </Text>
          </Text>
          <AnimatedPressable
            {...bindAnim}
            style={{
              ...flexbox.center,
              position: 'absolute',
              right: 0,
              backgroundColor: TOAST_CLOSE_BACKGROUND_COLOR[type],
              borderRadius: 16,
              ...animStyle
            }}
            onPress={() => removeToast(id)}
          >
            <CloseIcon width={8} height={8} color={theme[`${type}Decorative`]} strokeWidth="2.5" />
          </AnimatedPressable>
        </View>
      </View>
    </View>
  )
}

export default Toast

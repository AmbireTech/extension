import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import Text from '@common/components/Text'
import { Toast as ToastType } from '@common/contexts/toastContext'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import { ICON_MAP, parseTextLinks, TOAST_CLOSE_BACKGROUND_COLOR } from './helpers'
import { ParsedTextLink } from './types'

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

  return (
    <View
      style={{
        width: '100%',
        ...common.borderRadiusPrimary,
        ...spacings.mbTy,
        ...common.shadowSecondary
      }}
      testID={`${type}-${id}`}
    >
      <View
        style={[
          spacings.phSm,
          spacings.pvSm,
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
                    style={{ textDecorationLine: 'underline' } as any}
                  >
                    {element.text}
                  </Text>
                )
              })}
            </Text>
          </Text>
          <TouchableOpacity
            style={{
              ...flexbox.center,
              position: 'absolute',
              right: 0,
              backgroundColor: TOAST_CLOSE_BACKGROUND_COLOR[type],
              borderRadius: 16,
              width: 20,
              height: 20
            }}
            onPress={() => removeToast(id)}
          >
            <CloseIcon width={8} height={8} color={theme[`${type}Decorative`]} strokeWidth="2.5" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default Toast

import { ToastType, UseToastsOptions, UseToastsReturnType } from 'ambire-common/src/hooks/useToasts'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Linking, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import CheckIcon from '@assets/svg/CheckIcon'
import CloseIconRound from '@assets/svg/CloseIconRound'
import ErrorIcon from '@assets/svg/ErrorIcon'
import { useTranslation } from '@config/localization'
import Text from '@modules/common/components/Text'
import { TAB_BAR_HEIGHT } from '@modules/common/constants/router'
import { navigationRef } from '@modules/common/services/navigation'
import { isRouteWithTabBar } from '@modules/common/services/router'
import colors from '@modules/common/styles/colors'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'

import styles from './styles'

const ToastContext = React.createContext<UseToastsReturnType>({
  addToast: () => -1,
  removeToast: () => {}
})

const defaultOptions: Partial<UseToastsOptions> = {
  timeout: 8000,
  error: false,
  sticky: false
}

let id = 0

const ToastProvider: React.FC = ({ children }) => {
  const [toasts, setToasts] = useState<ToastType[]>([])
  const [hasTabBar, setHasTabBar] = useState(false)
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()

  useEffect(() => {
    // @ts-ignore
    const unsubscribe = navigationRef?.current?.addListener('state', () => {
      // @ts-ignore
      const routeName = navigationRef?.current?.getCurrentRoute()?.name

      setHasTabBar(isRouteWithTabBar(routeName))
    })

    return unsubscribe
  }, [])

  const removeToast = useCallback<UseToastsReturnType['removeToast']>((tId) => {
    setToasts((_toasts) => _toasts.filter((_t) => _t.id !== tId))
  }, [])

  const addToast = useCallback<UseToastsReturnType['addToast']>(
    (text, options) => {
      const toast: ToastType = {
        id: id++,
        text,
        ...defaultOptions,
        ...options
      }

      setToasts((_toasts) => [..._toasts, toast])

      !toast.sticky && setTimeout(() => removeToast(toast.id), toast.timeout)

      return toast.id
    },
    [setToasts, removeToast]
  )

  const onToastPress = useCallback(
    (_id: ToastType['id'], onClick?: ToastType['onClick'], url?: ToastType['url']) => {
      if (url) Linking.openURL(url)
      onClick ? onClick() : removeToast(_id)
    },
    [removeToast]
  )

  // -4 is a magic number
  // 44 is the height of the bottom tab navigation
  const tabBarHeight = hasTabBar ? TAB_BAR_HEIGHT : 0
  const bottomInset =
    insets.bottom > 0 ? insets.bottom - 4 + tabBarHeight : insets.bottom + tabBarHeight

  return (
    <ToastContext.Provider
      value={useMemo(
        () => ({
          addToast,
          removeToast
        }),
        [addToast, removeToast]
      )}
    >
      <View style={[styles.container, { bottom: bottomInset }]}>
        {/* eslint-disable-next-line @typescript-eslint/no-shadow */}
        {[...toasts].reverse().map(({ id, url, error, sticky, badge, text, onClick }) => (
          <View style={styles.toastWrapper} key={id}>
            <TouchableOpacity
              style={[styles.toast, error && styles.error]}
              onPress={() => onToastPress(id, onClick, url)}
              activeOpacity={0.9}
            >
              {!!badge && (
                <View style={[styles.badge, spacings.mrTy, error && styles.errorBadge]}>
                  <Text fontSize={10} weight="medium" color={colors.white}>
                    {badge}
                  </Text>
                </View>
              )}
              {!badge && <View style={spacings.prTy}>{error ? <ErrorIcon /> : <CheckIcon />}</View>}
              <View style={flexboxStyles.flex1}>
                <Text weight="medium" color={colors.patriotBlue} fontSize={12}>
                  {error ? t('Oops') : t('Success')}
                </Text>
                <Text numberOfLines={5} color={colors.patriotBlue} fontSize={12}>
                  {text}
                </Text>
              </View>
              {!!sticky && (
                <TouchableOpacity style={spacings.plTy} onPress={() => removeToast(id)}>
                  <CloseIconRound color={error ? colors.pink : colors.turquoise} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {children}
    </ToastContext.Provider>
  )
}

export { ToastContext, ToastProvider }

import React, { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import ToastComponent from '@common/components/Toast'
import { isWeb } from '@common/config/env'
import { HEADER_HEIGHT } from '@common/modules/header/components/Header/styles'
import { SPACING_TY } from '@common/styles/spacings'
import { Portal } from '@gorhom/portal'

import styles from './styles'

interface Props {
  children: React.ReactNode | React.ReactNode[]
}

export interface ToastOptions {
  timeout?: number
  type?: 'error' | 'success' | 'info' | 'warning'
  sticky?: boolean
  badge?: string
  isTypeLabelHidden?: boolean
  url?: string
}

export interface Toast extends ToastOptions {
  id: number
  text: string
}

// Magic spacing for positioning the toast list
// to match exactly the area of the header + its bottom spacing
const ADDITIONAL_TOP_SPACING_MOBILE = SPACING_TY

const ToastContext = React.createContext<{
  addToast: (text: string, options?: ToastOptions) => number
  removeToast: (id: number) => void
}>({
  addToast: () => -1,
  removeToast: () => {}
})

const defaultOptions = {
  timeout: 8000,
  error: false,
  sticky: false
}

let nextToastId = 0

const ToastProvider = ({ children }: Props) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const insets = useSafeAreaInsets()

  const removeToast = useCallback((tId: number) => {
    setToasts((_toasts) => _toasts.filter((_t) => _t.id !== tId))
  }, [])

  const addToast = useCallback(
    (text: string, options?: ToastOptions) => {
      const toast = {
        id: nextToastId++,
        text,
        ...defaultOptions,
        ...(options || {})
      }

      // Make sure that toasts won't be duplicated
      setToasts((prevToasts) => {
        const existingToast = prevToasts.find((t) => t.text === toast.text)

        const filteredPrevToasts = prevToasts.filter((t) => t.id !== existingToast?.id)

        return [...filteredPrevToasts, toast]
      })

      !toast.sticky && setTimeout(() => removeToast(toast.id), toast.timeout)

      return toast.id
    },
    [setToasts, removeToast]
  )

  const topInset = insets.top + HEADER_HEIGHT + (isWeb ? 0 : ADDITIONAL_TOP_SPACING_MOBILE)

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
      <Portal hostName="global">
        <View style={[styles.container, { top: topInset }]}>
          {toasts.map(({ id, type, text, url, isTypeLabelHidden = true }) => (
            <ToastComponent
              key={id}
              id={id}
              text={text}
              type={type}
              removeToast={removeToast}
              isTypeLabelHidden={isTypeLabelHidden}
              url={url}
            />
          ))}
        </View>
      </Portal>
      {children}
    </ToastContext.Provider>
  )
}

export { ToastContext, ToastProvider }

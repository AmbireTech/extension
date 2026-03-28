/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { ErrorRef } from '@ambire-common/interfaces/eventEmitter'
import { allControllersMapping } from '@common/constants/controllersMapping'
import { ToastOptions } from '@common/contexts/toastContext'
import useNavigation from '@common/hooks/useNavigation'
import useToast from '@common/hooks/useToast'
import eventBus from '@common/services/event/eventBus'

import { ControllerHelpersStore } from './controllerHelpersStore'
import { ControllerStore } from './controllerStore'
import { SubscriptionManager } from './subscriptionManager'
import { controllerStoreContextDefaults, ControllerStoreContextReturnType } from './types'

export const ControllerStoreContext = createContext<ControllerStoreContextReturnType>(
  controllerStoreContextDefaults
)

export const ControllerStoreProvider: React.FC<{
  children: React.ReactNode
  withErrorToasts?: boolean
}> = ({ children, withErrorToasts = false }) => {
  const { addToast } = useToast()
  const { navigate } = useNavigation()
  const ctrlOnUpdateIsDirtyFlags = useRef<Record<string, boolean>>({})
  const [isStoreReady, setIsStoreReady] = useState(false)

  const [controllerStore] = useState(
    () =>
      new ControllerStore({
        onReady: () => {
          setIsStoreReady(true)
        }
      })
  )

  const [stateSubscriptionManager] = useState(() => new SubscriptionManager())
  const [helpersSubscriptionManager] = useState(() => new SubscriptionManager())

  const [controllerHelpersStore] = useState(() => new ControllerHelpersStore())

  const debounceControllerUpdates = useCallback(
    (ctrlName: string, ctrl: EventEmitter, forceEmit?: boolean): 'DEBOUNCED' | 'EMITTED' => {
      if (forceEmit) {
        try {
          eventBus.emit(ctrlName, ctrl.toJSON(), forceEmit)
        } catch (error) {
          console.error(error)
        }
        controllerStore.update(ctrlName as any, ctrl, forceEmit)

        return 'EMITTED'
      }

      if (ctrlOnUpdateIsDirtyFlags.current[ctrlName]) return 'DEBOUNCED'
      ctrlOnUpdateIsDirtyFlags.current[ctrlName] = true
      // Debounce multiple emits in the same tick and only execute one of them
      setTimeout(() => {
        if (ctrlOnUpdateIsDirtyFlags.current[ctrlName]) {
          eventBus.emit(ctrlName, ctrl.toJSON(), forceEmit)
          controllerStore.update(ctrlName as any, ctrl, forceEmit)
        }
        ctrlOnUpdateIsDirtyFlags.current[ctrlName] = false
      }, 0)

      return 'EMITTED'
    },
    [controllerStore]
  )

  useEffect(() => {
    const onCtrlUpdate = ({
      ctrlName,
      ctrlState,
      forceEmit
    }: {
      ctrlName: string
      ctrlState: any
      forceEmit?: boolean
    }) => {
      if ((allControllersMapping as any)[ctrlName])
        controllerStore.update(ctrlName as any, ctrlState, forceEmit)
    }

    eventBus.addEventListener('ctrlUpdate', onCtrlUpdate)

    return () => eventBus.removeEventListener('ctrlUpdate', onCtrlUpdate)
  }, [controllerStore])

  useEffect(() => {
    const onError = (newState: { errors: ErrorRef[]; controller: string }) => {
      const lastError = newState.errors[newState.errors.length - 1]
      if (lastError) {
        if (lastError.level !== 'silent')
          if (withErrorToasts) {
            // Most of the errors incoming are descriptive and tend to be long,
            // so keep a longer timeout to give the user enough time to read them.
            addToast(lastError.message, { timeout: 12000, type: 'error' })
          }

        console.error(`Error in ${newState.controller} controller: ${lastError.message}`)
      }
    }

    eventBus.addEventListener('error', onError)

    return () => eventBus.removeEventListener('error', onError)
  }, [addToast, withErrorToasts])

  useEffect(() => {
    const onAddToast = ({ text, options }: { text: string; options: ToastOptions }) =>
      addToast(text, options)

    eventBus.addEventListener('addToast', onAddToast)

    return () => eventBus.removeEventListener('addToast', onAddToast)
  }, [addToast])

  useEffect(() => {
    const onNavigate = ({ route: navRoute }: { route: string }) => navigate(navRoute)

    eventBus.addEventListener('navigate', onNavigate)

    return () => eventBus.removeEventListener('navigate', onNavigate)
  }, [addToast, navigate])

  return (
    <ControllerStoreContext.Provider
      value={useMemo(
        () => ({
          controllerStore,
          controllerHelpersStore,
          stateSubscriptionManager,
          helpersSubscriptionManager,
          isStoreReady,
          debounceControllerUpdates
        }),
        [
          controllerStore,
          controllerHelpersStore,
          stateSubscriptionManager,
          helpersSubscriptionManager,
          isStoreReady,
          debounceControllerUpdates
        ]
      )}
    >
      {children}
    </ControllerStoreContext.Provider>
  )
}

import { EventEmitter as Emitter } from 'events'
/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react'

import { networks } from '@ambire-common/consts/networks'
import { DomainsController } from '@ambire-common/controllers/domains/domains'
import { EventEmitterRegistryController } from '@ambire-common/controllers/eventEmitterRegistry/eventEmitterRegistry'
import { ProvidersController } from '@ambire-common/controllers/providers/providers'
import { StorageController } from '@ambire-common/controllers/storage/storage'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext'
import { ControllerStoreContext } from '@common/contexts/controllerStoreContext'
import { RewardsBaseControllersMappingType } from '@legends/constants/controllersMapping'
import { Action } from '@web/extension-services/background/actions'
import { storage } from '@web/extension-services/background/webapi/storage'
import eventBus from '@web/extension-services/event/eventBus'

export const ControllersMiddlewareProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { controllerStore, debounceControllerUpdates } = useContext(ControllerStoreContext)

  useEffect(() => {
    controllerStore.init(
      Object.keys(controllers.current) as (keyof RewardsBaseControllersMappingType)[],
      (allCtrls: (keyof AllControllersMappingType)[]) => {
        allCtrls.forEach((ctrlName) => {
          controllerStore.update(ctrlName, (controllers.current as any)[ctrlName])
        })
      }
    )
  }, [controllerStore])

  const eventEmitterRegistry = useRef<EventEmitterRegistryController>(
    new EventEmitterRegistryController(() => {
      eventEmitterRegistry.current.values().forEach((ctrl) => {
        const hasOnUpdateInitialized = ctrl.onUpdateIds.includes('background')
        if (!hasOnUpdateInitialized) {
          ctrl.onUpdate(async (forceEmit) => {
            debounceControllerUpdates(ctrl.name, ctrl, forceEmit)
          }, 'background')
        }
      })

      //
      // Add onError listeners
      //

      eventEmitterRegistry.current.values().forEach((ctrl) => {
        const hasOnErrorInitialized = ctrl.onErrorIds.includes('background')

        if (!hasOnErrorInitialized) {
          ctrl.onError(() => {
            eventBus.emit('error', { errors: ctrl.emittedErrors, controller: ctrl.name })
            // TODO: sentry
            // captureBackgroundExceptionFromControllerError(error, ctrl.name)
          }, 'background')
        }
      })
    })
  )

  const controllers = useRef<RewardsBaseControllersMappingType>(
    (() => {
      const ctrls: RewardsBaseControllersMappingType = {} as RewardsBaseControllersMappingType
      ctrls.StorageController = new StorageController(storage)
      ctrls.ProvidersController = new ProvidersController({
        eventEmitterRegistry: eventEmitterRegistry.current,
        storage: ctrls.StorageController,
        getNetworks: () => networks,
        sendUiMessage: (params) => {
          eventBus.emit('receiveOneTimeData', params)
        }
      })

      ctrls.DomainsController = new DomainsController({
        eventEmitterRegistry: eventEmitterRegistry.current,
        providers: ctrls.ProvidersController.providers
      })

      return ctrls
    })()
  )

  const dispatch = useCallback((action: Action) => {
    if (action.type === 'method') {
      const { ctrlName, method, args } = action.params

      let targetCtrl: any = Object.values(controllers.current).find(
        (ctrl) => ctrl.name === ctrlName
      )
      if (!targetCtrl) {
        console.error(`handleAction: Controller ${ctrlName.toString()} not found`)
        return
      }

      if (targetCtrl && typeof targetCtrl[method] === 'function') {
        targetCtrl[method](...args)
      }

      return
    }

    //TODO: handle common actions if any for the legends app
  }, [])

  return (
    <ControllersMiddlewareContext.Provider value={useMemo(() => ({ dispatch }), [dispatch])}>
      {children}
    </ControllersMiddlewareContext.Provider>
  )
}

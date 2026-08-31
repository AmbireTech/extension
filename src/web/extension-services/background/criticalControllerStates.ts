import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import { awaitControllersInitialLoad } from '@common/utils/controllers'
import { serializeControllerForUI } from '@common/utils/serializeControllerForUI'
import { CRITICAL_CONTROLLERS } from '@web/constants/criticalControllers'
import { Port, PortMessenger } from '@web/extension-services/messengers'

/**
 * Pushes the states a view needs before it can paint anything, so its first screen doesn't have to
 * ask for them and wait a round-trip. Which screen that will be doesn't matter here - the set
 * covers every route a view can open on.
 */
export const sendCriticalControllerStates = async ({
  pm,
  port,
  eventEmitterRegistry
}: {
  pm: PortMessenger
  port: Port
  eventEmitterRegistry: IEventEmitterRegistryController
}) => {
  const registeredCtrls = eventEmitterRegistry.values()
  const criticalCtrls = CRITICAL_CONTROLLERS.map((ctrlName) =>
    registeredCtrls.find((c) => c.name === ctrlName)
  ).filter((ctrl) => !!ctrl)

  // Serializing a controller before it has loaded would ship a state the UI takes for a ready one,
  // which is enough to hide the splash over an empty screen.
  await awaitControllersInitialLoad(criticalCtrls)

  // The view may be gone by now - it only takes closing the popup right after opening it.
  if (!pm.ports.some((p) => p.id === port.id)) return

  criticalCtrls.forEach((ctrl) => {
    pm.sendToPort(port, '> ui', {
      method: ctrl.name,
      params: serializeControllerForUI(ctrl)
    })
  })
}

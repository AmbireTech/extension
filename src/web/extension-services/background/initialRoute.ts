import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import { View } from '@ambire-common/interfaces/ui'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import { getInitialRoute } from '@common/modules/router/helpers'
import { serializeControllerForUI } from '@common/utils/serializeControllerForUI'
import { ROUTE_CRITICAL_CONTROLLERS } from '@web/constants/criticalControllers'
import { Port, PortMessenger } from '@web/extension-services/messengers'

import type { MainController } from '@ambire-common/controllers/main/main'
type SendInitialRouteParams = {
  pm: PortMessenger
  port: Port
  mainCtrl: MainController
  eventEmitterRegistry: IEventEmitterRegistryController
  /**
   * Sends the states of the controllers the route needs along with it, so the screen can
   * paint without a second round-trip.
   */
  withCriticalControllerStates?: boolean
}

const awaitInitialLoad = (ctrl: object): Promise<void> | undefined =>
  (ctrl as { initialLoadPromise?: Promise<void> }).initialLoadPromise

/**
 * Computes the initial route in the background so the UI can navigate without
 * first syncing every controller's state across the port.
 */
export const resolveInitialRoute = async (
  mainCtrl: MainController,
  options: { isRequestWindow: boolean; isSidePanel?: boolean }
): Promise<string | null> => {
  const { isRequestWindow, isSidePanel = false } = options

  // Await only the controllers we need for getInitialRoute
  const routeControllers = {
    keystoreState: mainCtrl.keystore,
    requestsState: mainCtrl.requests,
    swapAndBridgeState: mainCtrl.swapAndBridge,
    transferState: mainCtrl.transfer,
    surveyState: mainCtrl.survey
  }

  await Promise.all([...Object.values(routeControllers), mainCtrl.accounts].map(awaitInitialLoad))

  const authStatus = mainCtrl.accounts.accounts.length
    ? AUTH_STATUS.AUTHENTICATED
    : AUTH_STATUS.NOT_AUTHENTICATED

  return getInitialRoute({ ...routeControllers, authStatus, isRequestWindow, isSidePanel })
}

/** A route can carry search params (benzin), while a view reports its path alone. */
const getRoutePath = (route: string) => route.split('?')[0]

export const sendInitialRoute = async ({
  pm,
  port,
  mainCtrl,
  eventEmitterRegistry,
  withCriticalControllerStates = false
}: SendInitialRouteParams) => {
  const route = await resolveInitialRoute(mainCtrl, {
    isRequestWindow: port.name === 'request-window',
    isSidePanel: port.name === 'side-panel'
  })

  pm.sendToPort(port, '> ui', { method: 'initialRoute', params: { route } })

  if (!withCriticalControllerStates) return

  const criticalControllers = (route && ROUTE_CRITICAL_CONTROLLERS[route]) || []
  const registeredCtrls = eventEmitterRegistry.values()
  criticalControllers.forEach((ctrlName) => {
    const ctrl = registeredCtrls.find((c) => c.name === ctrlName)
    if (!ctrl) return

    pm.sendToPort(port, '> ui', {
      method: ctrlName,
      params: serializeControllerForUI(ctrl)
    })
  })
}

/**
 * Moves the request window to the screen its state now calls for, so switching between
 * requests goes straight from one screen to the next.
 */
export const syncRequestWindowRoute = async ({
  pm,
  mainCtrl
}: {
  pm: PortMessenger
  mainCtrl: MainController
}) => {
  const requestWindowPorts = pm.ports.filter((port) => port.name === 'request-window')
  if (!requestWindowPorts.length) return

  const route = await resolveInitialRoute(mainCtrl, { isRequestWindow: true })

  // Nowhere to send it. The request window is closed by the requests controller in this
  // case, and until it is, its current screen beats an empty one.
  if (!route) return

  requestWindowPorts.forEach((port) => {
    const view = mainCtrl.ui.views.find((v: View) => v.id === port.id)
    if (view?.currentRoute === getRoutePath(route)) return

    pm.sendToPort(port, '> ui', { method: 'initialRoute', params: { route } })
  })
}

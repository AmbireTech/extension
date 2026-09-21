import { EventEmitter } from 'events'

import { UiManager } from '@ambire-common/interfaces/ui'
import eventBus from '@common/services/event/eventBus'

/**
 * The UI surface benzin gives to the controllers. Benzin is a single screen in an
 * ordinary tab, so everything built around the extension's windows, notifications
 * and view routing has nothing to act on and resolves empty. Toasts and the
 * one-off replies that `dispatchAndWait` waits for go through the event bus, the
 * same way the extension sends them over its port.
 */
export const benzinUiManager: UiManager = {
  window: {
    event: new EventEmitter(),
    open: async () => null,
    focus: async () => null,
    remove: async () => {},
    closePopupWithUrl: async () => {}
  },
  notification: {
    create: async () => {}
  },
  message: {
    sendToastMessage: (text, options) => eventBus.emit('addToast', { text, options }),
    sendUiMessage: (params) => eventBus.emit('receiveOneTimeData', params),
    sendNavigateMessage: () => {}
  },
  resolveViewRoute: async () => null
}

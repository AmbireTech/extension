import { useContext, useEffect } from 'react'

import { ControllerStoreContext } from '@common/contexts/controllerStoreContext'
import { catchUpScreens } from '@common/contexts/controllerStoreContext/screenCatchUp'

/**
 * The mobile-side behaviour of the selected account.
 *
 * Everything on every screen is about the selected account, and the screens the user is
 * not on have unsubscribed from the controllers - so a switch leaves them rendering an
 * account the user has moved off, until the transition back to them settles. They are
 * told to re-read the state the moment the switch lands instead.
 *
 * Mobile only, because it is the only environment that keeps screens mounted behind the
 * one on top, hence the only one where anything is ever left unsubscribed.
 *
 * Read off the store rather than through `useControllerState`, so the catch-up is
 * dispatched from the update itself: as a render and an effect it would land in the same
 * commit as the navigation the switch sets off, which is the commit that has to stay
 * small.
 */
const useSelectedAccountControllerHelpers = () => {
  const { controllerStore } = useContext(ControllerStoreContext)

  useEffect(() => {
    const readSelectedAccountAddr = () =>
      controllerStore.getSnapshot('SelectedAccountController')?.account?.addr

    let lastSelectedAccountAddr = readSelectedAccountAddr()

    const unsubscribe = controllerStore.subscribe('SelectedAccountController', () => {
      const addr = readSelectedAccountAddr()

      if (addr === lastSelectedAccountAddr) return

      lastSelectedAccountAddr = addr
      catchUpScreens()
    })

    return () => {
      unsubscribe()
    }
  }, [controllerStore])
}

export default useSelectedAccountControllerHelpers

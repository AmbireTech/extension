/**
 * Waits for the initial load of the given controllers, ignoring any that don't have one. Use it
 * before reading or serializing state that only means something once a controller has loaded.
 */
export const awaitControllersInitialLoad = async (controllers: object[]) => {
  await Promise.all(
    controllers.map((ctrl) => (ctrl as { initialLoadPromise?: Promise<void> }).initialLoadPromise)
  )
}

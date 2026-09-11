// A view is sent to its starting screen by the controllers, in a message that can be missed - the
// extension's port may still be reconnecting, and the mobile worker drops what it receives before
// it is ready. A view still sitting on no route asks again a few times before giving up, so a lost
// message doesn't leave the app on a blank screen.
export const VIEW_ROUTE_SYNC_RE_ASK_INTERVAL = 500
export const MAX_VIEW_ROUTE_SYNC_ATTEMPTS = 4

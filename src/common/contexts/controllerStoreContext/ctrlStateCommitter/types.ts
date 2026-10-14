/**
 * Hands a reconciled snapshot to the UI: the store exposes it and notifies the
 * controller's subscribers. Returns whether anything is subscribed to it at all, which
 * is what decides whether the delivery is worth pacing.
 */
export type DeliverCtrlState = (id: string, state: any) => boolean

/**
 * How a platform gets a controller's state in front of React.
 *
 * The UI is meant to see every forced update - `withStatus` drives
 * LOADING -> SUCCESS -> INITIAL through three of them, and a screen that reacts to
 * SUCCESS never runs if they arrive as one render. What it takes to guarantee that
 * differs per renderer, so each platform brings its own committer: `ctrlStateCommitter.ts`
 * for the DOM, `ctrlStateCommitter.native.ts` for React Native.
 */
export type CtrlStateCommitter = {
  /** Delivers the snapshot - now, or once the one before it has been rendered. */
  commit: (id: string, state: any, forceEmit?: boolean) => void
  /**
   * The newest snapshot still held back, if the platform holds any. The store reconciles
   * against it, so a queued snapshot is never skipped over.
   */
  pendingStateOf: (id: string) => any
  /** Drops whatever is held back. */
  destroy: () => void
}

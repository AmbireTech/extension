import { PRIVACY_POOLS_SUPPORTED_CHAIN_IDS } from '@ambire-common/consts/privacyPools'

/**
 * The pre-scanned Privacy Pools history a first sync starts from.
 *
 * Rebuilding a pool's history from `eth_getLogs` means hundreds of sequential requests per pool,
 * because the RPC serves 5000 blocks at a time - a quarter of an hour on Ethereum before the screen
 * shows anything. These files are that walk, already done, so a fresh install only has to cover the
 * blocks since they were built.
 *
 * They hold no secrets and are identical for everyone: the pools' public history, with the plugin's
 * own user secrets stripped before it dumps them. A wallet finds its own notes by deriving its
 * secrets locally and matching them against this.
 *
 * Refresh them with `node scripts/build-privacy-pools-snapshot.mjs`, which checks every pool's tree
 * against the chain before writing. Going stale costs a slower first sync, nothing more - and the
 * plugin verifies whatever it loaded against the pools at the end of every sync regardless.
 */

/**
 * Whether a first sync still starts from the files below.
 *
 * Off while we run Privacy Pools entirely off the saga-sync CDN, which serves the same pool history
 * fresher, verified, and without several megabytes in the build. The snapshots and the script that
 * builds them are kept until that has proven itself on Ethereum - and they are the only thing
 * Sepolia has either way, since nobody publishes it.
 *
 * Flipping this back on is the whole rollback: the plugin prefers a shipped history to the CDN, and
 * the CDN is skipped entirely for a chain that already has one.
 */
export const ARE_PRIVACY_POOLS_SNAPSHOTS_ENABLED = false

/** Keyed `privacy-pool-state-<chainId>-<entrypoint>`, exactly as the plugin keys its own store. */
export type PrivacyPoolsSnapshots = Record<string, any>

let snapshotsPromise: Promise<PrivacyPoolsSnapshots> | null = null

const fetchChainSnapshot = async (
  baseUrl: string,
  chainId: bigint
): Promise<PrivacyPoolsSnapshots> => {
  const response = await fetch(`${baseUrl}state.${chainId.toString()}.json`)
  if (!response.ok)
    throw new Error(`privacy pools snapshot ${chainId} responded ${response.status}`)

  return response.json()
}

/**
 * Loads every chain's snapshot as one record, once.
 *
 * Served same-origin as a build asset rather than imported, so the several megabytes stay out of
 * the bundle and are read only when a chain has nothing stored yet - once per install.
 *
 * A chain whose file is missing or unreadable is simply left out; the sync that follows is correct
 * either way, it just takes the walk. The failure is swallowed here on purpose rather than
 * reported, because there is nothing the user could do about it and nothing broken to tell them
 * about - the wallet behaves exactly as it did before snapshots existed.
 */
export const getPrivacyPoolsSnapshots = (baseUrl: string): Promise<PrivacyPoolsSnapshots> => {
  if (!snapshotsPromise) {
    snapshotsPromise = Promise.all(
      PRIVACY_POOLS_SUPPORTED_CHAIN_IDS.map((chainId) =>
        fetchChainSnapshot(baseUrl, chainId).catch(() => ({}))
      )
    )
      .then((snapshots) => Object.assign({}, ...snapshots))
      .catch(() => {
        // Cleared so a later cold chain retries rather than inheriting one failed load.
        snapshotsPromise = null

        return {}
      })
  }

  return snapshotsPromise
}

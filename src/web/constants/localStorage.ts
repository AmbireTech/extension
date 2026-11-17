import type { ProjectedRewardsStats } from '@ambire-common/libs/portfolio/interfaces'

/**
 * The storage structure of `pastProjectedRewardsScores`
 * @deprecated The extension rewards screen that wrote it was removed. Kept only for type compatibility.
 */
export type PastProjectedRewardsScoresLocalStorage = {
  extensionVersion: string
  data: {
    [accountAddr: string]: ProjectedRewardsStats
  }
}

/**
 * Values that the extension UI writes to `localStorage` directly, instead of
 * using the storage of the background. The values are serialized with `richJson`.
 */
export type ExtensionLocalStorage = {
  /**
   * Past projected rewards scores stored per account, used to animate the score changes.
   * @deprecated The extension rewards screen that wrote it was removed, so it is never set or read.
   * It can still be present for users who opened that screen. Kept only for type compatibility.
   */
  pastProjectedRewardsScores?: PastProjectedRewardsScoresLocalStorage
}

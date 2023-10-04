import { isAndroid, isiOS, isWeb } from '@common/config/env'
import { isExtension } from '@web/constants/browserapi'

// FIXME: add this enum in ambire-common v0.22 series (it exists in v0.21 only)
// import { RewardsSource } from 'ambire-common/src/hooks/useRewards/types'
export enum RewardsSource {
  UNSET = 'unset',
  WEB = 'web',
  ANDROID = 'android',
  IOS = 'ios',
  EXTENSION = 'extension'
}

const getRewardsSource = () => {
  if (isAndroid) return RewardsSource.ANDROID
  if (isiOS) return RewardsSource.IOS

  if (isExtension) return RewardsSource.EXTENSION
  if (isWeb) return RewardsSource.WEB

  return RewardsSource.UNSET
}

export default getRewardsSource

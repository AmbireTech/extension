import { RewardsSource } from 'ambire-common/src/hooks/useRewards/types'

import { isAndroid, isiOS, isWeb } from '@common/config/env'
import { isExtension } from '@web/constants/browserapi'

const getRewardsSource = () => {
  if (isAndroid) return RewardsSource.ANDROID
  if (isiOS) return RewardsSource.IOS

  if (isExtension) return RewardsSource.EXTENSION
  if (isWeb) return RewardsSource.WEB

  return RewardsSource.UNSET
}

export default getRewardsSource
